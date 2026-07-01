# HƯỚNG DẪN ĐÀO TẠO KỸ THUẬT (TRAINING.MD)
## Phát Triển Hệ Thống Split-Stack với Next.js & NestJS

Tài liệu này được thiết kế làm giáo trình đào tạo nội bộ dành cho kỹ sư phần mềm, tập trung vào thực hành thiết kế hệ thống, tối ưu hóa API, và quản lý trạng thái bất đồng bộ nâng cao.

---

## MỤC TIÊU BÀI HỌC
Sau khi hoàn thành tài liệu đào tạo này, học viên sẽ nắm vững:
1. Bản chất luồng dữ liệu của kiến trúc Split-Stack (Next.js $\leftrightarrow$ NestJS $\leftrightarrow$ PostgreSQL).
2. Cách xây dựng cơ chế phân trang phía backend và tích hợp đồng bộ với React Query ở frontend.
3. Kỹ thuật Segmented Mutations để tăng tính bảo mật và cô lập side-effects.
4. Cách triển khai Atomic Bulk Operations để giải quyết bài toán hiệu năng $N+1$ network overhead.

---

## PHẦN 1: TỔNG QUAN KIẾN TRÚC HỆ THỐNG

Hệ thống áp dụng mô hình **Split-Stack Architecture** tách biệt hoàn toàn giữa UI Layer và API Layer.

### Sơ đồ Luồng Dữ liệu Tổng thể
```text
[ Next.js Client Layer ] (Port 3000)
       │
       │ HTTP REST Requests (JSON Payload)
       ▼
[ NestJS API Gateway Layer ] (Port 3001)
       │
       │ Data Transfer Objects (DTO) / ValidationPipe
       ▼
[ NestJS Service Layer ]
       │
       │ Object-Relational Mapping (TypeORM / Prisma)
       ▼
[ PostgreSQL Database ]
```

### Nguyên tắc Phối hợp Tầng (Layer Principles)
*   **Next.js Client Layer:** Phụ trách Render giao diện (SSR/CSR), bắt các tương tác của người dùng, sử dụng **React Query** để quản lý cache trạng thái từ server.
*   **NestJS API Gateway:** Điểm tiếp nhận request duy nhất. Sử dụng `ValidationPipe` kết hợp `class-validator` để lọc và từ chối các payload lỗi từ vòng gửi xe.
*   **NestJS Service Layer:** Nơi chứa 100% logic nghiệp vụ (Business Logic). Không đưa xử lý logic vào Controller.
*   **Database Layer:** PostgreSQL được đánh chỉ mục (Index) các trường khóa chính/khóa ngoại và các trường dùng để sắp xếp/tìm kiếm (`createdAt`, `status`).

---

## PHẦN 2: THỰC HÀNH TÍNH NĂNG & THUẬT TOÁN

### CHỦ ĐỀ 1: Kỹ thuật Phân Trang Hiệu Năng Cao (GET /todos)

#### 1. Bài toán Nghiệp vụ & Tư duy Thuật toán
Khi bảng dữ liệu tăng lên hàng triệu bản ghi, việc sử dụng phân trang dạng `OFFSET` truyền thống sẽ dẫn đến hiện tượng **Linear Slowdown (O(N) Scanning)**, do hệ thống phải quét qua toàn bộ dữ liệu cũ trước khi lấy dữ liệu mới. 

Trong bài học này, chúng ta thiết kế một cơ chế lấy dữ liệu dựa trên **Indexed Query Execution** kết hợp tính nhất quán dữ liệu (`orderBy: { createdAt: 'desc' }`).

#### 2. Luồng Dữ liệu Chi tiết
```text
[Next.js Client] ──(GET /todos?limit=5&page=1)──► [NestJS Controller]
       ▲                                                   │
       │                                                   ▼
       │                                          [Validate Query DTO]
       │                                                   │
       │                                                   ▼
       │                                         [Execute Indexed Query]
       │                                                   │
       └───────────(Return Payload + Meta)─────────────────┘
```

#### 3. Thực hành Triển khai Backend (NestJS)

**Bước 1:** Định nghĩa đầu vào an toàn với DTO nhằm ép kiểu và đặt giới hạn (`src/todos/dto/get-todos.dto.ts`):
```typescript
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetTodosQueryDto {
  @IsOptional()
  @Type(() => Number) // Ép kiểu từ string query sang number
  @IsInt()
  @Min(1)
  @Max(50) // Giới hạn tối đa để tránh client làm nghẽn DB bằng cách truyền limit=1000000
  limit: number = 5;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;
}
```

**Bước 2:** Viết logic truy vấn có kiểm soát tại Service (`src/todos/todos.service.ts`):
```typescript
async findAllPaginated(query: GetTodosQueryDto) {
  const { limit, page } = query;
  
  // findManyAndCount thực thi đồng thời câu lệnh lấy dữ liệu và đếm tổng số dòng
  const [data, total] = await this.repo.todo.findManyAndCount({
    take: limit,
    skip: (page - 1) * limit,
    orderBy: { createdAt: 'desc' }, // Bắt buộc phải sắp xếp có tính xác định (deterministic)
  });

  return { 
    data, 
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

**Mẫu Dữ liệu Phản hồi Chuẩn (API JSON Response):**
```json
{
  "data": [
    { 
      "id": "uuid-999", 
      "title": "Implement offset pagination", 
      "status": "PENDING", 
      "createdAt": "2026-06-30T10:00:00Z" 
    }
  ],
  "meta": {
    "total": 24,
    "page": 2,
    "limit": 5,
    "totalPages": 5
  }
}
```

#### 4. Thực hành Triển khai Frontend (Next.js & TanStack Query)

Tại Client, chúng ta cần đảm bảo trải nghiệm mượt mà không nhấp nháy bằng cách dùng cơ chế `placeholderData: keepPreviousData`.

**File:** `app/dashboard/todo-feed.tsx`
```tsx
'use client';
import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

interface Todo {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiResponse {
  data: Todo[];
  meta: PaginationMeta;
}

// Hàm fetch biệt lập, không chứa side-effect trộn lẫn vào component
const fetchTodos = async (page: number, limit: number): Promise<ApiResponse> => {
  const res = await fetch(`http://localhost:3001/todos?limit=${limit}&page=${page}`);
  if (!res.ok) throw new Error('Network response failure while fetching items');
  return res.json();
};

export default function TodoFeed({ initialFallbackData }: { initialFallbackData: ApiResponse }) {
  const [page, setPage] = useState<number>(1);
  const limit = 5;

  // Sử dụng React Query quản lý trạng thái đồng bộ dữ liệu mạng
  const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
    queryKey: ['todos', { page, limit }],
    queryFn: () => fetchTodos(page, limit),
    placeholderData: keepPreviousData, // Giữ lại dữ liệu trang cũ khi đang fetch trang mới
    initialData: page === 1 ? initialFallbackData : undefined, // SSR Hydration
    staleTime: 5000, // Dữ liệu được coi là tươi (fresh) trong 5 giây
  });

  if (isLoading) return <div className="text-gray-500">Loading initial payload...</div>;
  if (isError) return <div className="text-red-500">Error: {error.message}</div>;

  const todos = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* List dữ liệu - Ẩn mờ 50% nếu đang trong trạng thái đổi page (isPlaceholderData === true) */}
      <div className={`space-y-2 ${isPlaceholderData ? 'opacity-50' : ''}`}>
        {todos.map((todo) => (
          <div key={todo.id} className="p-3 bg-gray-100 rounded border flex justify-between items-center">
            <span>{todo.title}</span>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded">{todo.status}</span>
          </div>
        ))}
      </div>

      {/* Giao diện nút phân trang */}
      {meta && (
        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-sm text-gray-600">
            Page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((old) => Math.max(old - 1, 1))}
              disabled={page <= 1 || isPlaceholderData}
              className="px-3 py-1 bg-white border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => {
                if (!isPlaceholderData && page < meta.totalPages) setPage((old) => old + 1);
              }}
              disabled={page >= meta.totalPages || isPlaceholderData}
              className="px-3 py-1 bg-white border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### CHỦ ĐỀ 2: Phân Mảnh Đột Biến Dữ Liệu (Segmented Mutations)

#### 1. Tại sao phải phân mảnh (Segmented Path)?
**Quy tắc thiết kế API cũ:** `PUT /todos/:id` nhận vào toàn bộ object và cập nhật mọi trường. 
*   **Rủi ro bảo mật:** Kẻ tấn công lợi dụng lỗ hổng Mass Assignment để thay đổi các trường cấm (ví dụ: `isAdmin`, `isArchived`, `deletedAt`).
*   **Giải pháp nâng cao:** Sử dụng các đường dẫn chuyên biệt (`PATCH /todos/:id/status`, `PATCH /todos/:id/archive`). Mỗi đường dẫn có một schema xác thực duy nhất, hạn chế tối đa lỗ hổng bề mặt.

#### 2. Luồng Dữ liệu
```text
           ┌──► PATCH /todos/:id/status  ──► Validate UpdateStatusDto
[Next.js] ─┤
           └──► PATCH /todos/:id/archive ──► Ghi nhận dấu thời gian deletedAt (Soft Delete)
```

#### 3. Thực hành Triển khai Backend (NestJS)

**Bước 1:** Thiết lập DTO nghiêm ngặt, chỉ cho phép nhận đúng enum mong muốn (`src/todos/dto/update-status.dto.ts`):
```typescript
import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(['PENDING', 'COMPLETED'])
  status: 'PENDING' | 'COMPLETED';
}
```

**Bước 2:** Cấu hình Controller với các Endpoint cô lập nghiệp vụ (`src/todos/todos.controller.ts`):
```typescript
import { Controller, Patch, Param, Body } from '@nestjs/common';
import { TodosService } from './todos.service';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('todos')
export class TodosController {
  constructor(private readonly service: TodosService) {}

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    // Chỉ có tác vụ cập nhật trạng thái được kích hoạt
    return this.service.changeStatus(id, dto.status);
  }

  @Patch(':id/archive')
  async archive(@Param('id') id: string) {
    // Tác vụ xóa mềm cô lập, không nhận payload từ body
    return this.service.softDelete(id);
  }
}
```

---

### CHỦ ĐỀ 3: Thao Tác Hàng Loạt Nguyên Tử (Atomic Bulk Operations)

#### 1. Tối ưu hóa Hiệu năng ($N+1$ Network Elimination)
**Kịch bản tồi:** Client lặp mảng 100 IDs $ightarrow$ Thực hiện 100 HTTP Requests `DELETE` đến server $ightarrow$ Tạo ra 100 kết nối DB độc lập. Kết quả: sập hệ thống do quá tải mạng.

**Giải pháp:** Gộp toàn bộ mảng ID vào 1 HTTP Request, thực thi duy nhất một câu lệnh SQL nguyên tử: `DELETE FROM todos WHERE id IN (...ids)`.

#### 2. Luồng Dữ liệu Tích hợp Đồng bộ
```text
[UI Chọn Checkbox] ──► [Nhấn Delete Button] ──► [Kích hoạt useMutation.mutate(ids)]
                                                         │
                                                         ▼
[Re-fetch Dữ liệu Mới] ◄── [queryClient.invalidate] ◄── [API: POST /todos/bulk-delete]
```

#### 3. Thực hành Triển khai Backend (NestJS)

**Bước 1:** DTO Kiểm tra mảng UUID phiên bản 4 (`src/todos/dto/bulk-ids.dto.ts`):
```typescript
import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class BulkIdsDto {
  @IsArray()
  @IsUUID('4', { each: true, message: 'Tất cả phần tử phải là UUID v4 hợp lệ' })
  @ArrayMinSize(1)
  ids: string[];
}
```

**Bước 2:** Câu lệnh thực thi cấp cơ sở dữ liệu (`src/todos/todos.service.ts`):
```typescript
async removeMany(ids: string[]): Promise<void> {
  // Thực thi Native Batch Delete, tối ưu hóa thời gian xử lý tại DB
  await this.repo.todo.deleteMany({
    where: {
      id: { in: ids },
    },
  });
}
```

#### 4. Thực hành Triển khai Frontend (Next.js & Cơ chế Tự động Invalidate Cache)

Điểm cốt lõi trong phần này là việc sử dụng phương thức `onSuccess` để kích hoạt cơ chế xóa cache của React Query, ép ứng dụng đồng bộ lại giao diện ngay tức thì mà không cần tải lại toàn bộ trang.

**File:** `components/bulk-action-bar.tsx`
```tsx
'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface BulkActionBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
}

const bulkDeleteTodos = async (ids: string[]): Promise<void> => {
  const response = await fetch('http://localhost:3001/todos/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error('Thao tác xóa hàng loạt thất bại');
};

export function BulkActionBar({ selectedIds, onClearSelection }: BulkActionBarProps) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: bulkDeleteTodos,
    onSuccess: () => {
      onClearSelection(); // Xóa sạch danh sách checkbox đã chọn trên UI
      
      // ĐÂY LÀ ĐIỂM CHỐT: Đánh dấu cache 'todos' đã cũ (stale), 
      // React Query tự động chạy lại hàm fetchTodos ở component TodoFeed
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onError: (error) => {
      console.error(error);
      alert('Không thể thực hiện xóa hàng loạt. Vui lòng thử lại.');
    },
  });

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white p-4 flex justify-between items-center border-t border-gray-200 z-50 shadow-lg">
      <p className="text-sm text-gray-700">
        Đang chọn: <strong>{selectedIds.length}</strong> nhiệm vụ
      </p>
      <button 
        onClick={() => mutate(selectedIds)} 
        disabled={isPending}
        className="bg-red-500 text-white p-2 rounded disabled:opacity-50 hover:bg-red-600 transition-colors"
      >
        {isPending ? 'Đang xử lý...' : 'Xóa Hàng Loạt Đã Chọn'}
      </button>
    </div>
  );
}
```

---

## BÀI TẬP KIỂM TRA ĐÁNH GIÁ (QUIZ & LAB)

### Câu hỏi Kiểm tra Lý thuyết
1. Tại sao cấu hình `limit` trong `GetTodosQueryDto` lại cần decorator `@Max(50)`? Rủi ro nào sẽ xảy ra nếu thiếu cấu hình này?
2. Hãy phân tích sự khác nhau giữa hành vi xử lý khi dùng `page-break` hoặc `keepPreviousData` trong kiến trúc React Query.
3. Việc chia nhỏ các endpoint đột biến dữ liệu (Segmented Mutations) mang lại lợi ích gì so với một API cập nhật tổng hợp `PUT`?

### Thực hành Phòng Lab (Hands-on Challenge)
*   **Đề bài:** Hãy mở rộng hệ thống bằng cách thêm tính năng `POST /todos/bulk-status-update`. Endpoint này nhận vào danh sách mảng `ids` và một trường `status` chung để cập nhật toàn bộ các nhiệm vụ được chọn sang trạng thái đó chỉ với 1 câu lệnh cơ sở dữ liệu duy nhất. Viết DTO kiểm định phía NestJS và tích hợp nút bấm tại `BulkActionBar` phía Frontend.
