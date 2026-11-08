# CSS Report

## Đã chuẩn hóa

- Thêm `variables.css` với design tokens.
- Thêm `base.css` cho reset/base accessibility/focus/mobile foundation.
- Thêm `theme.css` làm lớp cuối giải quyết conflict giữa page CSS.
- `header.css` và `footer.css` là stylesheet component riêng.
- `common.css` không còn phần legacy copy nguyên `header.css`, `footer.css`, `fix.css` ở đầu file.
- Loại `fix.css` khỏi page references.
- Dedupe stylesheet reference trong từng page.

## Design system

| Nhóm | Giá trị chính |
|---|---|
| Primary | `#7c2638` |
| Primary hover | `#5f1c2b` |
| Accent | `#b08d57` |
| Background | `#f4efe7` |
| Surface | `#fbfaf7` |
| Text | `#171717` |
| Border | `#ded8cc` |
| Radius | 4 / 8 / 14px |

## Responsive

Đã bổ sung breakpoint `900px` và `640px` cho Header, Footer, Profile layout, form và address card. Các page CSS cũ vẫn được giữ vì chúng còn có reference chức năng.

## Kết quả rà selector

- Không phát hiện rule trùng exact trong bộ User CSS sau khi dọn legacy prefix.
- Không phát hiện stylesheet reference trùng trong từng page.
- Không dùng thêm `!important` mới cho User page CSS ngoài lớp theme dùng để thắng các style legacy hiện có.
