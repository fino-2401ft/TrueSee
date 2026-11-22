# PRD --- Social Network & Messaging Platform

**Phiên bản:** 1.2  
**Trạng thái:** Baseline đã chốt quyết định sản phẩm --- Dùng cho Cursor Agent  
**Ngôn ngữ:** Tiếng Việt  
**Định hướng:** Ứng dụng mobile mạng xã hội và nhắn tin, làm theo từng phase nhỏ. Nhận dạng deepfake ưu tiên xử lý trên thiết bị, có server fallback khi cần và được người dùng đồng ý; đây là phase cuối, không làm cùng các phase nền tảng.

### Thay đổi so với 1.1

- Chuyển quyền riêng tư từ cấp tài khoản sang cấp từng bài viết (`Post.visibility`), mặc định `PUBLIC`.
- Chốt nhóm phải có tối thiểu 3 thành viên đang active khi tạo, tính cả người tạo.
- Chuyển Deepfake từ on-device-only sang hybrid: on-device ưu tiên, server fallback chỉ sau consent rõ ràng; clip tối đa 10 giây.

### Thay đổi kế thừa từ 1.0

- Chỉ làm mobile. Không làm phiên bản web.
- Quan hệ người dùng là theo dõi một chiều, không cần duyệt.
- Quyền riêng tư được cấu hình riêng cho từng bài viết: `PUBLIC` (mặc định) hoặc `FOLLOWERS`.
- Đăng bài viết cũng lưu offline và tự đồng bộ khi có mạng.
- Chat nhóm nằm trong lộ trình, sau khi chat 1-1 offline ổn định.
- Gọi thoại/video chỉ làm sau khi chat offline 1-1 đạt tiêu chí thoát.
- Không làm mã hóa đầu cuối.
- Video tải lên ở bài viết và chat tối đa 30 giây.
- Deepfake ưu tiên phân tích trên thiết bị; nếu thiết bị không hỗ trợ hoặc phân tích local thất bại vì giới hạn kỹ thuật, có thể dùng server fallback sau khi người dùng được thông báo và đồng ý. Clip tối đa 10 giây; chỉ làm ở phase cuối.
- Không còn một MVP làm một lúc. Mỗi phase xong và được xác nhận rồi mới sang phase sau.

------------------------------------------------------------------------

## 1. Tổng quan sản phẩm

### 1.1. Mô tả

Ứng dụng là nền tảng mạng xã hội kết hợp nhắn tin trên điện thoại, cho phép người dùng:

- Đăng ký, đăng nhập và quản lý hồ sơ cá nhân.
- Chọn quyền riêng tư cho từng bài viết: công khai hoặc chỉ follower.
- Theo dõi và bỏ theo dõi người dùng khác ngay, không cần người kia duyệt.
- Đăng bài viết có văn bản, hình ảnh hoặc video dài tối đa 30 giây.
- Soạn và lưu bài viết khi mất Internet. Bài được giữ trên máy và tự đồng bộ lên máy chủ khi có mạng.
- Xem bảng tin những bài mình được phép xem, thích, bình luận và chia sẻ.
- Tìm kiếm người dùng và xem phần hồ sơ luôn hiện (username, tên, avatar, bio).
- Nhắn tin riêng 1-1 và nhắn tin nhóm theo thời gian thực.
- Gửi hình ảnh và video dài tối đa 30 giây trong cuộc trò chuyện.
- Soạn và gửi tin nhắn khi thiết bị mất Internet. Tin nhắn được lưu cục bộ và tự động đồng bộ khi có mạng.
- Nhận thông báo về tin nhắn và hoạt động xã hội.
- Gọi thoại và gọi video 1-1 sau khi chat offline đã ổn định.

Ứng dụng theo hướng **offline-capable** cho đăng bài và nhắn tin. Người dùng vẫn xem dữ liệu đã lưu trên máy, soạn bài và soạn tin khi offline. Tải bảng tin mới, nhận tin từ người khác và gọi điện cần Internet.

Sản phẩm chỉ có ứng dụng mobile iOS và Android. Không xây dựng phiên bản web.

### 1.2. Nguyên tắc phạm vi

Các phase nền tảng không triển khai model, API hay giao diện nhận dạng deepfake. Không tạo màn hình AI giả lập và không gắn luồng hiện tại vào một model AI.

Kiến trúc auth, mạng xã hội, chat và cuộc gọi phải tách module để phase deepfake thêm sau mà không viết lại các module đó. Có thể chừa extension point ở mức kiến trúc. Chưa được tạo module deepfake khi chưa tới phase của nó.

Nhận dạng deepfake, khi được phép làm, ưu tiên chạy trên thiết bị. Nếu thiết bị không đủ khả năng chạy model hoặc phân tích local gặp lỗi kỹ thuật, ứng dụng có thể đề xuất server fallback. Chỉ tải clip lên server sau khi thông báo rõ và có sự đồng ý riêng của người dùng. Clip tối đa 10 giây. Kết quả gắn với clip người dùng chọn, không gắn nhãn một tài khoản người dùng là giả mạo.

Không làm toàn bộ sản phẩm trong một lượt. Cursor Agent chỉ triển khai đúng một phase, dừng lại, báo cáo, và chờ xác nhận trước khi sang phase tiếp theo.

### 1.3. Mục tiêu chính

1. Cung cấp mạng xã hội cơ bản trên mobile: hồ sơ, theo dõi, visibility từng bài viết và bảng tin.
2. Bài viết tạo khi offline không mất khi đóng/mở ứng dụng, và tự đồng bộ khi có Internet.
3. Cung cấp nhắn tin 1-1 ổn định, gồm text và media, rồi mới làm chat nhóm.
4. Tin nhắn tạo khi offline không mất khi đóng/mở ứng dụng.
5. Tự động đồng bộ tin nhắn và bài viết đang chờ khi có Internet trở lại.
6. Chỉ bắt đầu gọi thoại/video sau khi chat offline 1-1 đạt tiêu chí thoát.
7. Giữ chỗ cho nhận dạng deepfake ở phase cuối: ưu tiên on-device, server fallback có sự đồng ý, clip tối đa 10 giây.

------------------------------------------------------------------------

## 2. Người dùng mục tiêu và vai trò

### 2.1. Người dùng thông thường

- Đăng ký và sử dụng tài khoản cá nhân trên điện thoại.
- Chọn quyền riêng tư cho từng bài viết và theo dõi người khác.
- Tạo bài viết, kể cả khi offline, và tương tác với bài mình được xem.
- Tìm kiếm và xem hồ sơ người dùng khác.
- Nhắn tin 1-1, nhắn tin nhóm, gửi media.
- Thực hiện cuộc gọi sau khi tính năng gọi được mở ở phase tương ứng.

### 2.2. Quản trị viên

Trong các phase đầu, quản trị viên có thể là công cụ nội bộ tối giản. Chức năng tối thiểu dự kiến:

- Xem danh sách người dùng.
- Khóa hoặc mở khóa tài khoản.
- Xử lý nội dung bị báo cáo, nếu phase sau có chức năng báo cáo.

Không xây dựng hệ thống quản trị phức tạp trong các phase nền tảng. Không làm trang quản trị web.

------------------------------------------------------------------------

## 3. Nền tảng và công nghệ đề xuất

Cursor Agent phải tuân thủ stack sau, trừ khi repository hiện tại đã có quyết định kỹ thuật khác được xác nhận.

| Thành phần | Công nghệ |
| --- | --- |
| Mobile app | React Native + TypeScript |
| Mobile tooling | Expo Development Build (không dùng Expo Go nếu native module không tương thích) |
| Backend | NestJS + TypeScript |
| API | REST API |
| Realtime | Socket.IO |
| Database phía server | PostgreSQL |
| ORM | Prisma |
| Lưu media | Cloudinary |
| Local database | SQLite |
| Video/voice call | LiveKit + WebRTC, chỉ ở phase gọi |
| Deepfake inference fallback | Backend inference service, chỉ ở phase 15 và chỉ khi người dùng đồng ý upload |
| Push notification | Firebase Cloud Messaging (FCM), chỉ ở phase thông báo |
| State management | Một thư viện nhất quán sau khi kiểm tra repository; ưu tiên Zustand hoặc Redux Toolkit |
| Navigation | React Navigation hoặc Expo Router; không trộn hai giải pháp |
| Form và validation | React Hook Form + Zod nếu phù hợp với repository |
| Testing | Jest; Detox cho E2E mobile khi môi trường cho phép |
| CI | GitHub Actions |

Không thêm ứng dụng web, Next.js, React web hay trang quản trị web.

### 3.1. Quy tắc sử dụng dịch vụ

- PostgreSQL là nguồn dữ liệu chính thức trên server.
- SQLite lưu cache, bản nháp và hàng đợi đồng bộ trên thiết bị, cho cả tin nhắn và bài viết.
- Không dùng Firebase Realtime Database hoặc Firestore làm database song song với PostgreSQL.
- FCM chỉ dùng cho push notification, không dùng làm database.
- Cloudinary lưu ảnh và video được tải lên. Không dùng Cloudinary để truyền luồng cuộc gọi.
- LiveKit chỉ phụ trách cuộc gọi thoại/video. Không tự xây dựng giao thức WebRTC từ đầu. Không tích hợp LiveKit trước phase gọi.
- Không lưu password dạng plain text.
- Không lưu access token hoặc refresh token trong SQLite dạng không mã hóa. Dùng SecureStore, Keychain hoặc Keystore qua giải pháp phù hợp với Expo.
- Không triển khai mã hóa đầu cuối. Kênh vận chuyển dùng HTTPS và kết nối realtime bảo vệ bằng session. Server vẫn đọc được nội dung để lưu, đồng bộ và kiểm tra quyền.

------------------------------------------------------------------------

## 4. Phạm vi sản phẩm

### 4.1. Cách chia phạm vi

Không có một gói MVP phải làm hết trong một lượt. Phạm vi được chia thành 16 phase ở mục 14. Mỗi phase có tiêu chí thoát ở mục 13.

Thứ tự bắt buộc:

1. Nền tảng local.
2. Đăng ký, đăng nhập, đăng xuất.
3. Hồ sơ cá nhân.
4. Theo dõi và bỏ theo dõi.
5. Bài viết text online và feed có lọc quyền.
6. Ảnh bài viết.
7. Video bài viết tối đa 30 giây.
8. Đăng bài offline và đồng bộ.
9. Thích, bình luận, tìm người dùng.
10. Chat 1-1 online: text, ảnh, video tối đa 30 giây.
11. Chat 1-1 offline đến khi ổn định.
12. Chat nhóm, gồm đồng bộ offline tin nhắn nhóm.
13. Push notification.
14. Gọi thoại và gọi video 1-1.
15. Deepfake hybrid: on-device ưu tiên, server fallback có consent, clip tối đa 10 giây.
16. Hardening và bản build kiểm thử.

Phase 14 không được bắt đầu trước khi phase 11 đạt tiêu chí thoát và người dùng xác nhận chat offline đã ổn định. Phase 15 không được bắt đầu cùng các phase 1–14.

### 4.2. Quyết định sản phẩm đã chốt

- Nền tảng phát hành là mobile iOS và Android.
- Quan hệ là theo dõi một chiều. Bấm theo dõi là có hiệu lực ngay. Không có lời mời kết bạn và không có bước duyệt follow.
- Quyền riêng tư là thuộc tính của từng bài viết, không phải thuộc tính cấp tài khoản.
- Mỗi bài có `visibility`, mặc định `PUBLIC`.
- `PUBLIC`: mọi người dùng đã đăng nhập xem được bài viết.
- `FOLLOWERS`: chỉ tác giả và những người hiện đang theo dõi tác giả xem được bài viết.
- Username, tên hiển thị, avatar và bio luôn xem được, để người khác tìm và theo dõi.
- Follow/unfollow có hiệu lực ngay đối với quyền xem các bài `FOLLOWERS`; visibility đã lưu trên bài không tự thay đổi.
- Chat 1-1 và chat nhóm không bị chặn bởi quyền riêng tư bài viết.
- Bài viết và tin nhắn có thể tạo offline rồi đồng bộ.
- Chat nhóm nằm trong lộ trình, sau chat 1-1 offline.
- Cuộc gọi là phase riêng, sau chat offline 1-1.
- Không làm mã hóa đầu cuối.
- Mỗi video tải lên dài tối đa 30 giây.
- Deepfake ở phase cuối, ưu tiên on-device; server fallback chỉ khi người dùng đồng ý, clip tối đa 10 giây.

### 4.3. Ngoài phạm vi

- Ứng dụng web, trang marketing, hoặc trang quản trị web.
- Mã hóa đầu cuối (E2EE) cho tin nhắn, bài viết, media hoặc cuộc gọi.
- Kết bạn hai chiều, lời mời kết bạn, hoặc duyệt người theo dõi.
- Gọi nhóm, livestream, hội nghị nhiều người.
- Story, reels, hoặc một sản phẩm video ngắn riêng. Giới hạn 30 giây chỉ áp dụng cho video đính kèm bài viết và chat.
- Video tải lên dài hơn 30 giây.
- Thuật toán đề xuất nội dung.
- Báo cáo nội dung và moderation nâng cao, trừ khi một phase sau được xác nhận riêng.
- Đồng bộ đa thiết bị nâng cao và xử lý xung đột phức tạp.
- Huấn luyện hoặc fine-tune model AI trong các phase nền tảng.
- Nhận dạng deepfake trước phase 15.
- Clip deepfake dài hơn 10 giây.
- Gắn nhãn một tài khoản người dùng là deepfake hoặc giả mạo.
- Tự động tải clip lên server để nhận dạng mà không có sự đồng ý rõ ràng của người dùng.
- Dùng Cloudinary làm đường truyền cuộc gọi.
- Dùng Firebase làm nơi lưu chat hoặc bài viết.

------------------------------------------------------------------------

## 5. Yêu cầu chức năng chi tiết

Ưu tiên được thể hiện bằng phase, không bằng một danh sách P0 làm cùng lúc. Yêu cầu của phase sau không được triển khai sớm.

### 5.1. Xác thực và tài khoản

#### FR-AUTH-01 --- Đăng ký (Phase 2)

Người dùng tạo tài khoản bằng email và mật khẩu.

**Acceptance Criteria**

- Email phải đúng định dạng.
- Email không được trùng.
- Mật khẩu đáp ứng chính sách được cấu hình.
- Mật khẩu được hash ở backend bằng Argon2 hoặc bcrypt.
- Backend trả mã lỗi ổn định. Frontend không dựa vào nội dung message để rẽ nhánh.

#### FR-AUTH-02 --- Đăng nhập (Phase 2)

- Người dùng đăng nhập bằng email và mật khẩu.
- Hiển thị lỗi khi thông tin không đúng.
- Có giới hạn số lần đăng nhập thất bại.

#### FR-AUTH-03 --- Đăng xuất (Phase 2)

- Xóa thông tin xác thực cục bộ.
- Vô hiệu hóa refresh session trên server nếu hệ thống dùng refresh token.
- Dữ liệu local của tài khoản vừa đăng xuất không hiện cho tài khoản khác.

#### FR-AUTH-04 --- Khôi phục mật khẩu

Để sau phase 2, chỉ làm khi người dùng yêu cầu một phase riêng. Nếu làm, không tiết lộ email có tồn tại hay không.

#### FR-AUTH-05 --- Hồ sơ cá nhân (Phase 3)

Thông tin tối thiểu:

- ID.
- Username duy nhất.
- Tên hiển thị.
- Avatar.
- Bio.
- Ngày tạo tài khoản.

Người dùng xem hồ sơ của mình và của người khác. Chỉ sửa hồ sơ của chính mình. Username, tên hiển thị, avatar và bio của người khác luôn đọc được sau khi đăng nhập.

#### FR-SOC-10 --- Chọn quyền riêng tư cho bài viết (Phase 5)

- Khi tạo bài, người dùng chọn `PUBLIC` hoặc `FOLLOWERS`.
- Mặc định mỗi bài là `PUBLIC` nếu người dùng không thay đổi lựa chọn.
- Người dùng có thể sửa visibility của bài do mình tạo.
- Backend kiểm tra quyền ở feed, chi tiết bài, hồ sơ/bài viết của người dùng, like, comment và media. Không chỉ ẩn bài ở client.
- Visibility được lưu trên từng bài, không có `User.privacy` dùng để quyết định quyền xem bài.
- `FOLLOWERS` được đánh giá theo danh sách follower hiện tại tại thời điểm đọc; follow/unfollow có hiệu lực ngay.

------------------------------------------------------------------------

### 5.2. Theo dõi

#### FR-SOC-08 --- Theo dõi và bỏ theo dõi (Phase 4)

- Người dùng đã đăng nhập theo dõi người khác bằng một thao tác. Quan hệ có hiệu lực ngay.
- Không có trạng thái chờ duyệt.
- Người dùng bỏ theo dõi được.
- Không tự theo dõi chính mình.
- Một cặp `(followerId, followingId)` chỉ có một bản ghi.
- Hồ sơ hiển thị số follower, số following, và trạng thái mình đã theo dõi người đó chưa.
- Có danh sách follower và following, có phân trang.

**Acceptance Criteria**

- Theo dõi xong, lần đọc tiếp theo cho xem các bài `FOLLOWERS` của người đó.
- Bỏ theo dõi xong, người xem không còn đọc các bài `FOLLOWERS` của người đó.
- Follow hoặc unfollow không đổi `visibility` đã lưu trên từng bài.
- Gọi API theo dõi lặp lại không tạo hai bản ghi.

------------------------------------------------------------------------

### 5.3. Mạng xã hội

#### FR-SOC-01 --- Bảng tin (Phase 5)

- Feed chỉ gồm bài người xem được phép xem:
  - bài `PUBLIC` của người dùng bất kỳ;
  - bài `FOLLOWERS` của người dùng mà mình đang theo dõi;
  - bài của chính mình, bất kể visibility.
- Mỗi bài hiện tác giả, avatar, thời gian, nội dung, media nếu có, và số tương tác khi phase tương tác đã làm.
- Phân trang bằng cursor. Không tải toàn bộ bài một lần.
- Có loading, empty state và lỗi tải.
- Phase 5 chỉ bắt buộc bài text. Ảnh, video và tương tác thêm ở phase sau.
- Khi offline, feed hiện cache local và bài của mình đang chờ gửi. Không tải được bài mới từ server lúc offline.

#### FR-SOC-02 --- Tạo bài viết online (Phase 5–7)

Người dùng tạo bài gồm:

- Nội dung văn bản.
- Ảnh, từ phase 6.
- Video, từ phase 7, mỗi video dài tối đa 30 giây.
- Thời điểm tạo.
- `clientPostId` do client sinh, dạng UUID, dùng cho mọi lần tạo kể cả khi đang online.

Quy tắc:

- Bài phải có nội dung hoặc ít nhất một media.
- Phase 5 chỉ nhận text.
- Kiểm tra loại file, dung lượng và MIME type ở client và server.
- Video có `duration` lớn hơn 30 giây bị từ chối ở client trước khi đưa vào hàng đợi, và bị từ chối ở server nếu lọt tới API.
- Video không đọc được thời lượng thì bị từ chối.
- Số lượng media tối đa do backend cấu hình. Mỗi video trong bài đều phải không quá 30 giây.
- Giới hạn 30 giây không áp dụng cho cuộc gọi LiveKit.
- Media upload lên Cloudinary. Database chỉ lưu metadata và URL hoặc asset identifier.
- Không lưu file vào PostgreSQL.
- Quyền xem bài lấy từ `Post.visibility` của chính bài đó và quan hệ follow hiện tại, không lấy từ thuộc tính quyền riêng tư của tác giả.

#### FR-SOC-03 --- Sửa và xóa bài viết (Phase 5, đồng bộ offline ở Phase 8)

- Chỉ chủ bài được sửa hoặc xóa.
- Backend kiểm tra quyền, không chỉ ẩn nút.
- Xóa bài đã đồng bộ phải xử lý metadata media. Việc xóa asset Cloudinary phải an toàn và retry được.
- Bài chỉ mới có trên máy thì sửa nội dung, sửa `visibility` và xóa ngay trong SQLite, không gọi server.
- Bài đã có ID server, nếu sửa nội dung, sửa `visibility` hoặc xóa lúc offline, ghi vào `sync_queue` và cập nhật UI ngay.

#### FR-SOC-04 --- Thích bài viết (Phase 9)

- Người dùng like hoặc unlike bài mình được xem.
- Mỗi user có tối đa một like cho một bài.
- Thao tác idempotent, retry không tạo bản ghi trùng.
- Like một bài không có quyền xem trả lỗi quyền, không tạo like.

#### FR-SOC-05 --- Bình luận (Phase 9)

- Người dùng thêm, sửa, xóa bình luận của chính mình trên bài mình được xem.
- Danh sách bình luận có thứ tự xác định và có phân trang.
- Bình luận trên bài không có quyền xem bị từ chối.

#### FR-SOC-06 --- Tìm kiếm người dùng (Phase 9)

- Tìm theo username hoặc tên hiển thị.
- Giới hạn kết quả và debounce ở client.
- Kết quả luôn hiện username, tên, avatar và bio. Visibility của bài viết không làm ẩn hồ sơ.
- Bài viết không nằm trong kết quả tìm kiếm nếu người xem không có quyền.

#### FR-SOC-07 --- Chia sẻ bài viết (sau Phase 9, khi được yêu cầu)

- Có thể chia sẻ bằng deep link nội bộ hoặc native share sheet.
- Người mở link vẫn phải đăng nhập và vẫn bị kiểm tra quyền xem.
- Không làm màn hình web công khai cho bài viết.

#### FR-SOC-09 --- Đăng bài offline và đồng bộ (Phase 8)

Đây là yêu cầu bắt buộc của phase 8, áp dụng cho text, ảnh và video đã được các phase trước hỗ trợ.

**Kịch bản bắt buộc**

1. Người dùng soạn bài khi offline, hoặc mất mạng trước lúc gửi.
2. Ứng dụng tạo `clientPostId`, lưu bài cùng `visibility` đã chọn vào SQLite, trạng thái `queued`. Không chọn thì lưu `PUBLIC`.
3. Bài xuất hiện ngay trên feed của chính tác giả.
4. Đóng ứng dụng rồi mở lại, bài đang chờ vẫn còn.
5. Có Internet trở lại thì Sync Engine tự gửi bài đang chờ, không bắt người dùng nhấn gửi lần nữa.
6. Backend xác thực, kiểm tra quyền, lưu PostgreSQL và trả bài đã lưu.
7. Client chuyển trạng thái local sang `sent` và gắn `serverPostId`.
8. Nếu server đã lưu nhưng client mất response, lần gửi lại không tạo bài thứ hai.
9. Ảnh và video giữ file trong thư mục riêng của app cho đến khi Cloudinary nhận file và server xác nhận metadata.
10. Video dài hơn 30 giây không được đưa vào hàng đợi.

**Yêu cầu kỹ thuật**

- SQLite là nguồn hiển thị local. PostgreSQL là nguồn chính thức sau khi đồng bộ.
- Có bảng local cho bài viết và media local. Tên có thể theo convention của repository, trách nhiệm phải đủ các trường ở mục 8.2.
- Dùng lại `sync_queue` cho bài viết và tin nhắn. Không viết hai cơ chế retry khác nhau.
- Mỗi thao tác lưu loại việc, payload, số lần thử, thời điểm thử gần nhất, lỗi gần nhất và trạng thái.
- Retry theo exponential backoff có giới hạn, và chạy lại khi app mở hoặc có mạng.
- NetInfo, hoặc cơ chế tương đương, chỉ là tín hiệu. Có mạng chưa có nghĩa là API đang sống.
- Unique constraint trên `(authorId, clientPostId)` để chống tạo trùng.
- Trong cùng một tác giả, các bài đang chờ giữ thứ tự tạo.
- Không xóa bài `queued`, `sending` hoặc `failed` khi đăng xuất. Đổi tài khoản thì dữ liệu tách theo user.
- File media bị hệ điều hành xóa thì chuyển `failed` và yêu cầu chọn lại file.
- Feed và hồ sơ lấy từ server phải lọc theo quyền tại thời điểm đọc.
- Cache bài của người khác được cập nhật lại sau lần đồng bộ thành công. Nếu server không còn cho xem, client xóa bài đó khỏi cache. Không cần xóa từ xa mọi máy trong phase này.

**Acceptance Criteria**

- Bài text tạo offline vẫn còn sau khi force-close và mở lại.
- Có mạng thì bài tự gửi, không cần bấm gửi lại.
- Retry không tạo hai bài trên server.
- Bài pending có trạng thái nhận biết được.
- Đồng bộ lỗi thì người dùng retry thủ công được.
- Tài khoản khác trên cùng máy không thấy bài pending.
- Thiết bị khác của cùng tài khoản chỉ thấy bài sau khi server đã xác nhận.
- Video trên 30 giây bị chặn trước khi lưu vào hàng đợi.
- Bài offline giữ đúng `visibility` đã chọn sau khi mở lại app và sau khi đồng bộ. Server lưu đúng giá trị đó.

**Giới hạn offline của bài viết**

- Xem được bài đã cache và bài của mình đang chờ gửi.
- Không nhận bài mới của người khác khi offline.
- Không tải media Cloudinary chưa có trên máy.
- Like, bình luận và tìm kiếm người dùng trong phase 9 cần mạng, trừ khi một phase sau nói khác.

------------------------------------------------------------------------

### 5.4. Nhắn tin

#### FR-CHAT-01 --- Danh sách cuộc trò chuyện (Phase 10, nhóm ở Phase 12)

- Hiện các cuộc trò chuyện mà người dùng tham gia.
- Phase 10 chỉ có hội thoại `DIRECT`.
- Phase 12 thêm hội thoại `GROUP`.
- Hiện avatar hoặc ảnh nhóm, tên, tin nhắn gần nhất và thời gian.
- Có unread count.
- Sắp theo hoạt động mới nhất.
- Danh sách đã cache vẫn xem được khi offline.

#### FR-CHAT-02 --- Tin nhắn văn bản 1-1 realtime (Phase 10)

- Gửi tin văn bản trong hội thoại 1-1.
- Tin mới phát qua Socket.IO.
- Backend xác minh người gửi là thành viên.
- Mỗi tin có `clientMessageId` UUID do client tạo trước khi gửi.
- Server lưu tin trước khi phát sự kiện đã gửi.
- Khi reconnect, client lấy tin bị bỏ lỡ bằng cursor hoặc sync token, không chỉ dựa vào event socket.
- Visibility `FOLLOWERS` của bài viết không chặn việc tạo hoặc gửi chat 1-1.

#### FR-CHAT-03 --- Ảnh và video trong chat (Phase 10)

- Chọn ảnh hoặc video từ máy và gửi trong chat.
- Video chat dài tối đa 30 giây. Client và server đều từ chối video dài hơn hoặc không đọc được thời lượng.
- Media upload Cloudinary.
- Tin media chỉ thành `sent` sau khi upload xong và server lưu metadata.
- Upload lỗi thì giữ file local nếu còn, và cho retry.
- Hiện preview, loại media, trạng thái upload và lỗi.
- Không đọc cả video lớn vào RAM. Dùng luồng upload phù hợp.
- Giới hạn 30 giây không áp dụng cho cuộc gọi.

#### FR-CHAT-04 --- Trạng thái tin nhắn (Phase 10)

Trạng thái tối thiểu:

- `queued`: đã lưu local, chưa gửi server.
- `sending`: đang gửi hoặc đang upload.
- `sent`: server đã xác nhận lưu.
- `failed`: lỗi, người dùng hoặc hệ thống retry theo chính sách.

Có thể thêm `delivered` và `read` ở phase sau. Không hiện "đã đọc" nếu server chưa xác nhận.

#### FR-CHAT-05 --- Chat 1-1 offline và tự động đồng bộ (Phase 11)

Đây là cổng chặn trước phase gọi thoại/video.

**Kịch bản bắt buộc**

1. Người dùng mở hội thoại khi online. Dữ liệu hội thoại được lưu SQLite.
2. Thiết bị mất Internet.
3. Người dùng soạn và nhấn gửi.
4. Ứng dụng tạo `clientMessageId`, lưu SQLite, trạng thái `queued`.
5. Tin xuất hiện ngay trong cuộc trò chuyện.
6. Đóng ứng dụng và mở lại, tin đang chờ vẫn còn.
7. Có Internet thì ứng dụng tự đưa tin pending vào hàng đợi đồng bộ.
8. Backend xác thực, lưu PostgreSQL và trả kết quả.
9. Client cập nhật `sent` và gắn ID server.
10. Server đã nhận tin nhưng client không nhận response thì lần retry không tạo tin trùng.

**Yêu cầu kỹ thuật**

- SQLite là nguồn hiển thị của màn chat. PostgreSQL là nguồn chính thức.
- Có `local_messages` và `sync_queue`.
- Mỗi message local có `clientMessageId`, `conversationId`, `senderId`, nội dung hoặc metadata media, thời điểm tạo, trạng thái, `serverMessageId` có thể rỗng.
- Hàng đợi lưu loại thao tác, payload, số lần thử, thời điểm thử, lỗi và trạng thái.
- Retry exponential backoff có giới hạn, tiếp tục khi app mở lại hoặc có mạng.
- Có mạng không đồng nghĩa API sống.
- Unique trên `(senderId, clientMessageId)`.
- API đồng bộ gửi lại an toàn và trả kết quả từng tin.
- Trong một hội thoại, không đảo thứ tự tạo của tin đang gửi.
- Tin nhận khi online được ghi local trước hoặc cùng lúc với cập nhật UI.
- Sau reconnect, tải bù tin từ server bằng cursor hoặc cặp `createdAt + id` ổn định.
- Không xóa tin `queued`, `sending` hoặc `failed` khi đăng xuất. Đổi tài khoản thì tách dữ liệu theo user.
- Không xóa file media local trước khi upload thành công và server xác nhận metadata.
- Media offline nằm trong thư mục riêng của app. Hết file thì chuyển `failed` và yêu cầu chọn lại.
- Video dài hơn 30 giây không vào hàng đợi.

**Acceptance Criteria**

- Tin text gửi offline còn sau force-close và mở lại.
- Có mạng thì tin tự gửi, không cần nhấn gửi lần nữa.
- Retry không tạo bản ghi trùng.
- Thứ tự tin trong một hội thoại theo quy tắc đã chọn được giữ.
- Tin pending nhận biết được trên UI.
- Lỗi đồng bộ thì retry thủ công được.
- Tài khoản khác không thấy hàng đợi này.
- Thiết bị khác chỉ thấy tin sau khi server xác nhận.
- Tin người khác gửi trong lúc máy offline được tải bù sau reconnect.
- Media pending được giữ đến khi upload thành công hoặc người dùng xử lý lỗi.

**Giới hạn offline của chat**

- Soạn và xếp hàng tin khi offline.
- Xem lịch sử đã cache.
- Không nhận tin mới của người khác khi máy đang offline.
- Không gọi thoại hoặc video khi offline.
- Không tải media chưa cache.

Phase 14 chỉ được mở sau khi các acceptance criteria của FR-CHAT-05 đã đạt và người dùng xác nhận.

#### FR-CHAT-06 --- Xóa tin nhắn

Chưa thuộc các phase đã xếp. Khi làm, phải phân biệt xóa cache local và thu hồi trên server. Xóa cache không xóa dữ liệu server.

#### FR-CHAT-07 --- Online, typing, read

Có thể làm sau phase chat offline nếu người dùng yêu cầu. Đây không phải dữ liệu cần giữ khi mất mạng. Không được giả định còn đúng khi offline.

#### FR-CHAT-08 --- Chat nhóm (Phase 12)

- Người dùng tạo nhóm với tên và tối thiểu 3 thành viên, tính cả người tạo.
- Người tạo là chủ nhóm.
- Chủ nhóm thêm thành viên, xóa thành viên khác và đổi tên nhóm.
- Thành viên rời nhóm được.
- Chủ nhóm muốn rời thì chuyển quyền chủ nhóm cho thành viên khác trước.
- Chủ nhóm xóa nhóm thì hội thoại không còn nhận tin mới.
- Nhóm còn dưới 3 người vì có người rời vẫn là nhóm. Không tự biến thành chat 1-1.
- Gửi text, ảnh và video trong nhóm. Video vẫn tối đa 30 giây.
- Backend chỉ cho thành viên hiện tại gửi và đọc tin.
- Realtime, lịch sử, phân trang, `clientMessageId` và idempotency dùng cùng quy tắc với chat 1-1.
- Tin nhắn trong nhóm đã nằm trên máy đồng bộ offline giống FR-CHAT-05.
- Tạo nhóm, thêm người, xóa người, đổi tên và rời nhóm cần Internet trong phase này.
- Không làm gọi nhóm.

**Acceptance Criteria**

- Tạo nhóm với ít hơn 3 thành viên bị từ chối.
- Người không phải thành viên không đọc và không gửi tin.
- Tin text nhóm gửi offline còn sau khi mở lại app và tự đồng bộ khi có mạng.
- Retry không tạo tin nhóm trùng.
- Thành viên mới xem được lịch sử tin đang lưu trên server, gồm tin gửi trước khi họ được thêm.

------------------------------------------------------------------------

### 5.5. Cuộc gọi thoại và video

Phase 14. Không triển khai ở các phase trước. Không bắt đầu nếu phase 11 chưa được xác nhận xong.

#### FR-CALL-01 --- Gọi thoại 1-1 (Phase 14)

- Bắt đầu cuộc gọi thoại với người đang chat 1-1.
- Dùng LiveKit SDK và WebRTC.
- Backend cấp token room có thời hạn sau khi kiểm tra quyền.
- Chỉ người được phép mới vào room.
- Có trạng thái ringing, connecting, connected, ended và failed.
- Xử lý từ chối, không trả lời, mất kết nối và kết thúc.
- Không lưu nội dung âm thanh cuộc gọi.

#### FR-CALL-02 --- Gọi video 1-1 (Phase 14)

- Có hình camera local và remote.
- Bật hoặc tắt microphone và camera.
- Hiện trạng thái kết nối.
- Xin quyền camera và microphone. Xử lý trường hợp người dùng từ chối.
- Không áp dụng giới hạn video 30 giây cho luồng gọi.
- Không nhận dạng deepfake trên luồng gọi trong phase này.
- Không lưu video cuộc gọi.

#### FR-CALL-03 --- Lịch sử cuộc gọi (Phase 14)

- Lưu người gọi, người nhận, loại cuộc gọi, thời điểm và trạng thái.
- Không lưu file âm thanh hoặc video cuộc gọi.

Không làm cuộc gọi bằng cách upload stream lên Cloudinary. Không làm gọi nhóm.

------------------------------------------------------------------------

### 5.6. Thông báo

#### FR-NOTI-01 --- Push notification tin nhắn (Phase 13)

- Phase 13 chỉ bắt đầu sau phase 12.
- Gửi push khi người nhận không đang mở cuộc trò chuyện tương ứng.
- Áp dụng cho cả chat 1-1 và chat nhóm.
- Không gửi notification cho chính người gửi.
- Payload không chứa nội dung riêng tư đầy đủ.
- Bấm notification mở đúng cuộc trò chuyện.
- Token FCM được đăng ký, cập nhật và thu hồi.

#### FR-NOTI-02 --- Thông báo tương tác xã hội (Phase 13)

- Thông báo like hoặc comment mới.
- Người nhận tắt được từng loại nếu màn cài đặt của phase này có công tắc.
- Không thông báo cho chính người gây ra tương tác.

------------------------------------------------------------------------

### 5.7. Nhận dạng deepfake hybrid (on-device ưu tiên, server fallback)

#### FR-AI-01 --- Phân tích clip tối đa 10 giây (Phase 15)

Chỉ làm khi người dùng xác nhận bắt đầu phase 15. Các phase trước không tạo API, model, màn hình hoặc nút giả cho tính năng này.

- Người dùng chọn một video trên máy để phân tích.
- Clip dài hơn 10 giây bị từ chối trước khi chạy phân tích. Không tự cắt lấy 10 giây đầu trừ khi người dùng tự chọn đoạn.
- Ứng dụng phải thử phân tích trên thiết bị trước.
- Nếu thiết bị không hỗ trợ model, không đủ tài nguyên hoặc quá trình local thất bại do lỗi kỹ thuật, ứng dụng có thể đề xuất server fallback.
- Trước khi upload, phải hiển thị rõ clip nào sẽ được gửi, mục đích xử lý và xin người dùng đồng ý riêng. Nếu người dùng từ chối hoặc offline, không upload; hiển thị trạng thái chưa thể phân tích và cho phép thử lại trên thiết bị khi phù hợp.
- Không tự động fallback lên server khi chưa có sự đồng ý của người dùng.
- Kết quả hiện cho người đang dùng máy đó, gắn với clip vừa chọn.
- Không ghi kết quả thành nhãn của một tài khoản người dùng.
- Không chạy trên luồng gọi realtime.
- Không huấn luyện model trong ứng dụng.
- Lỗi model hoặc thiết bị không đủ khả năng phải có trạng thái lỗi, không được hiện kết quả giả.

Chi tiết model, ngưỡng điểm, thư viện on-device và server inference chỉ được chốt ở đầu phase 15, sau khi người dùng xác nhận. PRD này khóa hành vi sản phẩm: on-device là đường xử lý mặc định; server là phương án dự phòng có consent; clip tối đa 10 giây; không làm sớm.

------------------------------------------------------------------------

## 6. Yêu cầu phi chức năng

### 6.1. Bảo mật

- Mọi API cần xác thực, trừ endpoint public được liệt kê. Đăng ký và đăng nhập là public.
- Không có API web công khai để đọc bài viết khi chưa đăng nhập.
- Backend kiểm tra quyền xem bài ở feed, chi tiết bài, like, comment và media của bài.
- Backend kiểm tra thành viên hội thoại ở mọi thao tác chat.
- Dùng HTTPS khi triển khai.
- Validate dữ liệu ở server.
- Giới hạn loại file, dung lượng, và thời lượng video tải lên không quá 30 giây.
- Không lưu mật khẩu plain text.
- Không commit secrets hoặc API keys.
- Cloudinary dùng signed upload hoặc cơ chế tương đương. Không nhúng API secret vào app.
- LiveKit token chỉ do backend cấp trong phase gọi, sau khi kiểm tra quyền.
- Log không ghi password, token, hoặc nội dung riêng tư không cần cho việc chẩn đoán.
- Không làm E2EE. Không thiết kế database theo hướng server không đọc được nội dung.

### 6.2. Hiệu năng

- Feed, lịch sử chat, follower và following phải phân trang.
- Không tải toàn bộ media vào RAM.
- UI bài viết và chat phản hồi ngay bằng dữ liệu local.
- Đồng bộ nền giới hạn số việc chạy song song.
- Có thể cache avatar và thumbnail.

### 6.3. Độ tin cậy

- Bài viết và tin nhắn đã lưu local phải còn sau khi khởi động lại app.
- API tạo bài và tạo tin phải idempotent theo ID client sinh.
- Event realtime không phải nơi lưu duy nhất. Dữ liệu quan trọng nằm ở database.
- Reconnect phải có resync.
- Upload và sync có retry, và lỗi quan sát được trên UI.

### 6.4. Khả năng bảo trì

- Chia module rõ.
- Tách business logic khỏi UI và controller.
- DTO và schema validation nhất quán.
- Mọi đổi schema có migration.
- Có unit test cho đồng bộ offline và idempotency của cả tin nhắn và bài viết.
- Có tài liệu API OpenAPI hoặc Swagger cho các endpoint của phase đang làm. Không cần viết trước toàn bộ API của phase chưa làm.

------------------------------------------------------------------------

## 7. Kiến trúc hệ thống đề xuất

### 7.1. Tổng quan

```text
React Native Mobile App
  ├── Presentation (Screens / Components)
  ├── Application (Use Cases)
  ├── Domain (Entities / Repository Interfaces)
  ├── Infrastructure
  │    ├── REST API Client
  │    ├── Socket.IO Client
  │    ├── SQLite Local Database
  │    ├── Sync Engine (posts + messages)
  │    ├── Secure Token Storage
  │    ├── Cloudinary Upload Client
  │    └── LiveKit Client (chỉ phase gọi)
  └── Network / App Lifecycle Monitor
             |
             | HTTPS REST + WebSocket
             v
NestJS Backend
  ├── Auth Module
  ├── Users Module
  ├── Follows Module
  ├── Posts Module
  ├── Comments Module
  ├── Likes Module
  ├── Conversations Module (DIRECT + GROUP)
  ├── Messages Module
  ├── Uploads Module
  ├── Calls Module (chỉ phase gọi)
  ├── Notifications Module (chỉ phase thông báo)
  └── Prisma
       |
       v
   PostgreSQL

External Services:
  - Cloudinary: ảnh và video tải lên
  - LiveKit: media cuộc gọi, chỉ phase gọi
  - Firebase Cloud Messaging: push notification, chỉ phase thông báo
```

Module của phase sau được tạo khi bắt đầu phase đó. Không tạo Calls, Notifications hoặc Deepfake ở phase nền tảng chỉ để "cho đủ sơ đồ".

### 7.2. Mobile architecture

Clean Architecture theo hướng thực dụng:

- **Presentation:** màn hình, component, navigation, view state.
- **Application:** use case, điều phối sync.
- **Domain:** entity, interface repository, quy tắc quyền xem và quy tắc 30 giây.
- **Infrastructure:** API, SQLite, Socket.IO, Cloudinary, LiveKit khi tới phase, repository implementation.

Không tạo abstraction không có người dùng. Sync Engine là một chỗ cho bài viết và tin nhắn.

### 7.3. Backend modules

Tạo dần theo phase:

- Phase 2: `AuthModule`
- Phase 3: `UsersModule`
- Phase 4: `FollowsModule`
- Phase 5–8: `PostsModule`, `UploadsModule`
- Phase 9: `LikesModule`, `CommentsModule`
- Phase 10–12: `ConversationsModule`, `MessagesModule`
- Phase 13: `NotificationsModule`
- Phase 14: `CallsModule`
- Phase 15: module inference on-device và endpoint/service server fallback có kiểm soát consent; không tạo trước phase 15

Prisma truy cập PostgreSQL. Controller không chứa business logic dài.

### 7.4. Nguyên tắc dữ liệu

- PostgreSQL lưu dữ liệu đã được server xác nhận.
- SQLite lưu cache, bản nháp và hàng đợi.
- Record server có ID ổn định.
- `clientPostId` và `clientMessageId` dùng để retry an toàn.
- Backend lưu và trả thời gian UTC. Client hiện theo timezone máy.
- Entity cần đồng bộ có `createdAt` và `updatedAt`.
- Có index cho khóa ngoại, thời gian, hội thoại, follower và truy vấn feed.
- Quyền xem bài được tính từ `Post.visibility`, `Post.authorId` và bảng follow tại thời điểm request.

------------------------------------------------------------------------

## 8. Mô hình dữ liệu sơ bộ

Đây là hướng entity, chưa phải schema Prisma cuối cùng. Trước migration, rà lại quan hệ, constraint và index. Chỉ tạo bảng phục vụ phase đang làm.

### 8.1. Server PostgreSQL

#### User

- `id`
- `email` unique
- `username` unique
- `passwordHash`
- `displayName`
- `avatarUrl` nullable
- `bio` nullable
- `isActive`
- `createdAt`
- `updatedAt`

#### Follow

- `followerId`: người bấm theo dõi
- `followingId`: người được theo dõi
- `createdAt`
- Khóa duy nhất `(followerId, followingId)`
- `followerId` khác `followingId`

Không có bảng lời mời theo dõi.

#### Post

- `id`
- `authorId`
- `clientPostId`
- `content` nullable nếu có media
- `visibility`: `PUBLIC` hoặc `FOLLOWERS`, mặc định `PUBLIC`
- `createdAt`
- `updatedAt`
- Unique `(authorId, clientPostId)`

Không có cột quyền riêng tư trên `User` để quyết định quyền xem bài. Quyền riêng tư được lưu tại `Post.visibility`.

#### PostMedia

- `id`
- `postId`
- `mediaType`: `IMAGE` hoặc `VIDEO`
- `cloudinaryPublicId`
- `url`
- `thumbnailUrl` nullable
- `width` và `height` nullable
- `duration` nullable, bắt buộc với `VIDEO` và không lớn hơn 30 giây

#### PostLike

- `id`
- `postId`
- `userId`
- `createdAt`
- Unique `(postId, userId)`

#### Comment

- `id`
- `postId`
- `authorId`
- `content`
- `createdAt`
- `updatedAt`

#### Conversation

- `id`
- `type`: `DIRECT` hoặc `GROUP`
- `name` nullable với `DIRECT`, bắt buộc với `GROUP`
- `ownerId` nullable với `DIRECT`, bắt buộc với `GROUP`
- `createdAt`
- `updatedAt`

#### ConversationParticipant

- `conversationId`
- `userId`
- `joinedAt`
- `leftAt` nullable
- Unique `(conversationId, userId)` cho thành viên đang active, hoặc constraint tương đương không cho hai dòng active trùng

Hội thoại `GROUP` khi tạo phải có ít nhất 3 participant đang active.

#### Message

- `id`
- `conversationId`
- `senderId`
- `clientMessageId`
- `type`: `TEXT`, `IMAGE` hoặc `VIDEO`
- `content` nullable với tin chỉ có media
- `createdAt`
- `updatedAt`
- Unique `(senderId, clientMessageId)`

#### MessageMedia

- `id`
- `messageId`
- `mediaType`
- `cloudinaryPublicId`
- `url`
- `thumbnailUrl` nullable
- `fileName` nullable
- `fileSize` nullable
- `mimeType` nullable
- `duration` nullable, bắt buộc với video và không lớn hơn 30 giây

#### DevicePushToken

Tạo ở phase 13.

- `id`
- `userId`
- `token`
- `platform`
- `createdAt`
- `updatedAt`

#### Call

Tạo ở phase 14.

- `id`
- `conversationId`
- `initiatorId`
- `roomName`
- `callType`: `AUDIO` hoặc `VIDEO`
- `status`
- `startedAt` nullable
- `endedAt` nullable
- `createdAt`

Không lưu file media cuộc gọi.

### 8.2. SQLite local

Dữ liệu tách theo tài khoản đăng nhập.

#### local_posts

- `localId`
- `serverPostId` nullable
- `clientPostId` unique trong phạm vi user local
- `userId` chủ dữ liệu local
- `authorId`
- `content`
- `visibility`: `PUBLIC` hoặc `FOLLOWERS`, mặc định `PUBLIC`
- `status`
- `createdAt`
- `updatedAt`
- `syncError` nullable

#### local_post_media

- `localId`
- `clientPostId`
- `mediaType`
- `localPath` nullable
- `remoteUrl` nullable
- `duration` nullable
- `status`

#### local_conversations

- `id`
- `userId`
- `type`
- `title`
- `lastMessageAt`
- `unreadCount`
- `updatedAt`

#### local_messages

- `localId`
- `serverMessageId` nullable
- `clientMessageId` unique
- `conversationId`
- `userId`
- `senderId`
- `type`
- `content`
- `mediaLocalPath` nullable
- `mediaRemoteUrl` nullable
- `duration` nullable
- `status`
- `createdAt`
- `updatedAt`
- `syncError` nullable

#### sync_queue

Dùng chung cho bài viết và tin nhắn.

- `id`
- `userId`
- `operationType`: ví dụ `CREATE_POST`, `UPDATE_POST`, `DELETE_POST`, `SEND_MESSAGE`
- `entityId`
- `payload`
- `status`
- `attemptCount`
- `nextRetryAt`
- `lastError` nullable
- `createdAt`
- `updatedAt`

Có index và khóa ngoại phù hợp. Không lưu file media lớn trong SQLite. Chỉ lưu đường dẫn và metadata.

------------------------------------------------------------------------

## 9. Thiết kế Offline Sync Engine

Một Sync Engine xử lý hàng đợi của bài viết và tin nhắn. Quy tắc retry, backoff, phân loại lỗi và cô lập tài khoản là chung.

### 9.1. Luồng gửi tin nhắn text

```text
User taps Send
      |
      v
Generate clientMessageId (UUID)
      |
      v
Insert message into SQLite
status = queued
      |
      v
Render message immediately
      |
      v
Is network/API reachable?
   /          \
 No            Yes
 |              |
Keep queued     Set sending
 |              |
Wait for        POST message to backend
connectivity    with clientMessageId
                |
                v
        Server checks idempotency
           /           \
      Existing       New
         |             |
 Return same       Save in PostgreSQL
 message               |
           \           /
                v
       Return server message
                |
                v
 Update SQLite: sent + serverMessageId
```

Tin trong nhóm đi cùng luồng này. Server kiểm tra thêm người gửi còn là thành viên.

### 9.2. Luồng đăng bài

```text
User taps Post
      |
      v
Reject video if duration is missing or > 30s
      |
      v
Generate clientPostId (UUID)
      |
      v
Store visibility
PUBLIC by default, or FOLLOWERS if chosen
      |
      v
Insert post and local media into SQLite
status = queued
visibility included
      |
      v
Show post on own feed immediately
      |
      v
Is network/API reachable?
   /          \
 No            Yes
 |              |
Keep queued     Upload local media to Cloudinary
 |              then POST clientPostId + visibility
 |              |
Wait for        v
connectivity    Server checks (authorId, clientPostId)
                /           \
           Existing       New
              |             |
          Return same    Save post
          post              |
                \           /
                     v
            Return server post
                     |
                     v
      Update SQLite: sent + serverPostId
```

Ảnh và video chưa upload thì giữ file local. Thiếu file thì `failed`. Payload đồng bộ gồm `clientPostId` và `visibility` đã lưu local.

### 9.3. Luồng reconnect

Khi app khởi động, app trở lại foreground, hoặc mạng được khôi phục:

1. Kiểm tra session.
2. Mở SQLite và lấy queue của user hiện tại.
3. Kiểm tra connectivity. Có thể gọi một request nhẹ để biết API sống.
4. Lấy thao tác pending theo thứ tự tạo.
5. Gửi từng thao tác, hoặc theo batch với concurrency giới hạn.
6. Mỗi thao tác dùng đúng idempotency key đã lưu: `clientPostId` hoặc `clientMessageId`.
7. Cập nhật trạng thái local theo kết quả.
8. Sau khi đẩy queue, kéo bài và tin mới từ server bằng cursor.
9. Upsert dữ liệu được phép xem vào SQLite.
10. Gỡ khỏi cache những bài server không còn cho xem.
11. Việc lỗi tạm thời tiếp tục retry theo exponential backoff.

Trong một hội thoại, tin nhắn không được gửi đảo thứ tự. Bài viết của cùng một tác giả cũng giữ thứ tự tạo.

### 9.4. Phân loại lỗi

- **Lỗi tạm thời:** timeout, mất mạng, HTTP 5xx, rate limit có retry-after. Được retry.
- **Lỗi vĩnh viễn:** payload không hợp lệ, video quá 30 giây, không còn quyền, file không hợp lệ, không còn là thành viên. Chuyển `failed` và hiện lý do.
- **Unauthorized:** thử refresh session nếu có. Thất bại thì yêu cầu đăng nhập lại. Queue vẫn gắn đúng user, không gửi bằng tài khoản khác.
- **Trùng:** server trả bản ghi đã có theo idempotency key. Client đánh dấu `sent`, không tạo bản ghi mới.

### 9.5. Thứ tự và trùng lặp

- Bài trên feed và tin trong một hội thoại có thứ tự ổn định.
- Thời điểm soạn ở client và thời điểm server nhận là hai giá trị khác nhau. UI chọn một quy tắc và dùng thống nhất.
- Không dùng timestamp làm khóa định danh.
- Socket và REST phải upsert cùng một tin qua `clientMessageId`, không tạo hai dòng.
- Nếu event realtime tới trước response REST, ghép bằng `clientMessageId`.
- Bài viết không cần phát realtime trong phase 8. Kéo feed và upsert bằng `clientPostId` là đủ.

------------------------------------------------------------------------

## 10. API và realtime contract sơ bộ

Tên endpoint là gợi ý. Với mỗi phase, viết contract của các endpoint phase đó trước hoặc cùng lúc với code. Không cần hoàn thiện contract của phase chưa làm.

### 10.1. REST endpoints

#### Auth (Phase 2)

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh` nếu dùng refresh token
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

#### Users và hồ sơ (Phase 3)

- `GET /api/v1/users/:id`
- `PATCH /api/v1/users/me` chỉ cập nhật thông tin hồ sơ; không cập nhật visibility bài viết

`GET /users/:id` luôn trả username, tên, avatar và bio cho người đã đăng nhập. Không trả trường privacy cấp tài khoản. Danh sách bài của hồ sơ phải lọc từng bài theo `Post.visibility` và quan hệ follow hiện tại.

#### Follow (Phase 4)

- `POST /api/v1/users/:id/follow`
- `DELETE /api/v1/users/:id/follow`
- `GET /api/v1/users/:id/followers?cursor=`
- `GET /api/v1/users/:id/following?cursor=`

Theo dõi chính mình trả lỗi. Theo dõi lần hai trả trạng thái đã theo dõi, không tạo thêm dòng.

#### Posts (Phase 5–8)

- `GET /api/v1/posts` feed đã lọc quyền
- `POST /api/v1/posts` nhận `clientPostId` và `visibility` (mặc định `PUBLIC`)
- `GET /api/v1/posts/:id` trả 403 hoặc 404 nếu không được xem
- `PATCH /api/v1/posts/:id` sửa nội dung và `visibility` của chính bài viết
- `DELETE /api/v1/posts/:id`
- `GET /api/v1/users/:id/posts?cursor=` cùng quy tắc lọc quyền
- `POST /api/v1/posts/sync` cho batch bài pending, nếu chọn đồng bộ theo lô

Bài không được xem thì không trả nội dung và không trả URL media.

#### Tương tác và tìm kiếm (Phase 9)

- `POST /api/v1/posts/:id/likes`
- `DELETE /api/v1/posts/:id/likes`
- `GET /api/v1/posts/:id/comments`
- `POST /api/v1/posts/:id/comments`
- `PATCH /api/v1/comments/:id`
- `DELETE /api/v1/comments/:id`
- `GET /api/v1/users/search?q=`

#### Uploads (Phase 6 trở đi)

- `POST /api/v1/uploads/signature` hoặc endpoint cấp thông tin upload an toàn.
- Client upload thẳng Cloudinary bằng tham số đã ký.
- `POST /api/v1/uploads/complete` nếu backend cần xác nhận metadata.
- Server từ chối video có `duration` lớn hơn 30 hoặc thiếu `duration`. Mã lỗi ổn định, ví dụ `VIDEO_DURATION_EXCEEDED`.

#### Conversations và messages (Phase 10 và 12)

- `GET /api/v1/conversations`
- `POST /api/v1/conversations/direct`
- `POST /api/v1/conversations/group` với tên và danh sách thành viên; tổng số thành viên đang active lúc tạo phải ít nhất 3, tính cả người tạo
- `PATCH /api/v1/conversations/:id` đổi tên nhóm
- `POST /api/v1/conversations/:id/members`
- `DELETE /api/v1/conversations/:id/members/:userId`
- `POST /api/v1/conversations/:id/leave`
- `POST /api/v1/conversations/:id/transfer-owner`
- `GET /api/v1/conversations/:id/messages?cursor=`
- `POST /api/v1/conversations/:id/messages`
- `POST /api/v1/messages/sync` nếu đồng bộ theo lô
- `GET /api/v1/messages/sync?cursor=`

#### Calls (Phase 14)

- `POST /api/v1/calls`
- `POST /api/v1/calls/:id/join-token`
- `POST /api/v1/calls/:id/end`

#### Notifications (Phase 13)

- `POST /api/v1/devices/push-tokens`
- `DELETE /api/v1/devices/push-tokens/:id`

Phase 15 được phép có endpoint server fallback để nhận clip tối đa 10 giây, nhưng chỉ được gọi sau khi người dùng đồng ý rõ ràng. Server fallback không phải đường xử lý mặc định.

### 10.2. Socket.IO events

Dùng từ phase chat.

Client gửi:

- `conversation:join`
- `conversation:leave`
- `message:send` nếu chọn gửi qua socket. Vẫn phải lưu DB và chống trùng
- `message:read` chỉ nếu phase sau làm read receipt
- `typing:start` và `typing:stop` chỉ nếu phase sau làm typing

Server gửi:

- `message:new`
- `message:sent`
- `message:failed`
- `conversation:updated`
- `user:presence` chỉ nếu phase sau làm presence
- `call:incoming` và `call:status` chỉ từ phase 14

Socket.IO không phải nơi lưu bền. PostgreSQL là nguồn chính. REST sync khôi phục dữ liệu sau mất kết nối.

------------------------------------------------------------------------

## 11. UX/UI yêu cầu

Chỉ làm màn hình của phase đang triển khai.

### 11.1. Màn hình theo phase

Phase 2:

1. Splash và khởi tạo app.
2. Đăng ký.
3. Đăng nhập.

Phase 3:

4. Hồ sơ của tôi, gồm xem và sửa thông tin cá nhân.
5. Cài đặt tài khoản, gồm đăng xuất.

Phase 4 và 9:

6. Hồ sơ người khác, gồm nút theo dõi, số follower và following.
7. Danh sách follower và following.
8. Tìm người dùng.

Phase 5–8:

9. Home và feed.
10. Tạo và sửa bài, gồm chọn `visibility` là `PUBLIC` hoặc `FOLLOWERS`.
11. Chi tiết bài.

Phase 9 thêm like và comment trên chi tiết bài.

Phase 10–12:

12. Danh sách hội thoại.
13. Chi tiết chat 1-1.
14. Xem trước media.
15. Tạo nhóm.
16. Thông tin nhóm và thành viên.
17. Chi tiết chat nhóm.

Phase 13: phần cài đặt thông báo nếu có công tắc.

Phase 14:

18. Cuộc gọi đến.
19. Cuộc gọi thoại.
20. Cuộc gọi video.

Phase 15: một màn chọn clip và xem kết quả phân tích. Không đưa màn này vào navigation ở các phase trước.

Không có route web.

### 11.2. Trạng thái giao diện bắt buộc

- Loading.
- Empty.
- Error.
- Offline.
- Uploading.
- Pending sync, cho cả bài viết và tin nhắn.
- Failed kèm retry.
- Không có quyền xem bài.
- Permission denied cho thư viện ảnh, camera hoặc microphone khi phase đó cần quyền.

### 11.3. Bài viết và chat khi offline

- Có dấu hiệu offline, không chặn cả màn hình.
- Bài hoặc tin vừa gửi hiện ngay.
- Mục đang chờ có trạng thái "Đang chờ gửi".
- Gửi xong thì "Đã gửi".
- Lỗi thì "Chưa gửi" và có nút thử lại.
- Không xóa nội dung người dùng vừa soạn khi lỗi.
- Có mạng thì tự đồng bộ, không đòi người dùng bấm thêm.
- Có thể hiện số mục đang chờ gửi.
- Bài `FOLLOWERS` của người mình chưa theo dõi không được hiển thị nội dung; hồ sơ vẫn hiện username, tên, avatar và bio, kèm nút theo dõi. Một hồ sơ có thể có cả bài `PUBLIC` và `FOLLOWERS`.
- Video quá 30 giây bị báo trước khi lưu offline.

------------------------------------------------------------------------

## 12. Bảo mật và quyền riêng tư cho media

- App không chứa Cloudinary API secret.
- Backend cấp chữ ký upload có hạn và giới hạn thư mục hoặc resource type.
- Backend xác minh quyền tạo bài hoặc tin trước khi nhận metadata media.
- Kiểm tra MIME, dung lượng và thời lượng. Không chỉ nhìn đuôi file.
- Video bài viết và video chat: `duration <= 30`. Thiếu thời lượng thì từ chối.
- Feed và danh sách chat dùng thumbnail. Tải bản đủ khi người dùng mở.
- Xóa media không được xóa asset còn được chỗ khác tham chiếu.
- Không ghi URL có token truy cập vào log.
- URL media của bài không được trả cho người không có quyền xem.
- Không mã hóa đầu cuối. Bảo vệ bằng HTTPS, kiểm tra quyền và token lưu ở nơi an toàn của hệ điều hành.

------------------------------------------------------------------------

## 13. Tiêu chí thoát theo phase

Một phase chỉ xong khi các mục của phase đó đạt và người dùng xác nhận. Không dùng một checklist chung gồm cả cuộc gọi và deepfake.

### Phase 1 --- Nền tảng

- [ ] Đã đọc repository và không ghi đè phần đang có nếu chưa cần.
- [ ] App mobile và backend chạy được ở local.
- [ ] Prisma migration chạy được.
- [ ] Có `.env.example`, không commit `.env`.
- [ ] Có hướng dẫn chạy local.

### Phase 2 --- Xác thực

- [ ] Đăng ký, đăng nhập, đăng xuất thành công trên app.
- [ ] API riêng tư từ chối khi chưa đăng nhập.
- [ ] Password không lưu plain text.
- [ ] Token không nằm trong SQLite dạng không mã hóa.

### Phase 3 --- Hồ sơ

- [ ] Xem và sửa hồ sơ của mình.
- [ ] Người khác vẫn thấy username, tên, avatar và bio.
- [ ] Không có trường privacy cấp tài khoản trong model User.

### Phase 4 --- Theo dõi

- [ ] Theo dõi có hiệu lực ngay, không có bước duyệt.
- [ ] Bỏ theo dõi được.
- [ ] Không theo dõi chính mình và không tạo follow trùng.
- [ ] Thấy số lượng và danh sách follower, following.

### Phase 5 --- Bài text và feed

- [ ] Tạo, sửa, xóa bài text của mình.
- [ ] Feed phân trang.
- [ ] Feed và chi tiết bài tôn trọng quyền `PUBLIC` và `FOLLOWERS`.
- [ ] Người không được xem không nhận nội dung bài từ API.

### Phase 6 --- Ảnh bài viết

- [ ] Đăng được ảnh lên Cloudinary và hiện trên feed.
- [ ] App không chứa secret Cloudinary.
- [ ] File không được ghi vào PostgreSQL.

### Phase 7 --- Video bài viết

- [ ] Đăng được video có thời lượng từ 30 giây trở xuống.
- [ ] Video dài hơn 30 giây hoặc không đọc được thời lượng bị từ chối ở client và server.

### Phase 8 --- Đăng bài offline

- [ ] Tạo bài offline, thấy ngay trên feed của mình.
- [ ] Force-close rồi mở lại vẫn còn bài pending.
- [ ] Có mạng thì tự đồng bộ.
- [ ] Retry không tạo bài trùng.
- [ ] Đổi tài khoản không thấy bài pending của nhau.
- [ ] Media pending còn đến khi upload thành công hoặc người dùng xử lý lỗi.
- [ ] Bài tạo offline giữ đúng `visibility` sau khi mở lại app và sau khi đồng bộ.

### Phase 9 --- Tương tác và tìm kiếm

- [ ] Like và unlike không tạo dữ liệu trùng.
- [ ] Comment hiện đúng và chỉ chủ comment sửa hoặc xóa comment của mình.
- [ ] Không like hoặc comment bài không có quyền xem.
- [ ] Tìm được người dùng theo username hoặc tên.

### Phase 10 --- Chat 1-1 online

- [ ] Tạo hoặc mở hội thoại 1-1.
- [ ] Gửi và nhận text realtime.
- [ ] Gửi và nhận ảnh.
- [ ] Gửi và nhận video không quá 30 giây. Video dài hơn bị từ chối.
- [ ] Lịch sử nằm trên server và có phân trang.
- [ ] Có trạng thái sending, sent và failed.

### Phase 11 --- Chat 1-1 offline

- [ ] Gửi text offline và thấy ngay.
- [ ] Force-close rồi mở lại vẫn còn tin pending.
- [ ] Có mạng thì tự đồng bộ.
- [ ] Retry không tạo tin trùng.
- [ ] Tin đến trong lúc offline được tải bù sau reconnect.
- [ ] Dữ liệu nhiều tài khoản không trộn.
- [ ] Media pending được giữ đến khi upload thành công hoặc người dùng xử lý lỗi.

Phase 14 chưa được bắt đầu khi phase 11 chưa được xác nhận.

### Phase 12 --- Chat nhóm

- [ ] Tạo nhóm với ít nhất 3 thành viên đang active, tính cả người tạo.
- [ ] Chủ nhóm thêm, xóa thành viên và đổi tên.
- [ ] Thành viên rời nhóm được.
- [ ] Người ngoài nhóm không đọc và không gửi tin.
- [ ] Gửi text, ảnh và video tối đa 30 giây.
- [ ] Tin nhóm gửi offline tự đồng bộ và không bị trùng khi retry.
- [ ] Không có gọi nhóm.

### Phase 13 --- Thông báo

- [ ] Có push cho tin nhắn mới, gồm nhóm.
- [ ] Không đẩy thông báo cho người gửi.
- [ ] Bấm thông báo mở đúng hội thoại.
- [ ] Có thông báo like hoặc comment.
- [ ] Token được đăng ký và thu hồi.

### Phase 14 --- Gọi 1-1

- [ ] Gọi thoại và gọi video 1-1 khi online, trên thiết bị thật nếu môi trường cho phép.
- [ ] Có xử lý quyền camera và microphone.
- [ ] Có xử lý mất mạng và kết thúc cuộc gọi.
- [ ] Không lưu file cuộc gọi.
- [ ] Không giới hạn cuộc gọi ở 30 giây.

### Phase 15 --- Deepfake hybrid (on-device ưu tiên, server fallback)

- [ ] Chỉ chạy khi phase này được xác nhận bắt đầu.
- [ ] Clip dài hơn 10 giây bị từ chối.
- [ ] On-device là phương án mặc định.
- [ ] Server fallback chỉ chạy sau khi người dùng được thông báo và đồng ý rõ ràng.
- [ ] Không upload clip nếu người dùng từ chối hoặc thiết bị đang offline.
- [ ] Kết quả không trở thành nhãn của một tài khoản.
- [ ] Các phase trước không còn sót UI hoặc API giả của tính năng này.

### Phase 16 --- Hardening

- [ ] Có unit test cho sync bài viết, sync tin nhắn và idempotency.
- [ ] Có tài liệu API của các phase đã làm.
- [ ] Không commit secrets.
- [ ] Có hướng dẫn chạy và bản build mobile kiểm thử được.

------------------------------------------------------------------------

## 14. Kế hoạch triển khai

Mỗi phase là một lượt làm việc. Hết phase thì dừng, nêu file đã đổi, cách chạy, test đã chạy và kết quả. Chờ xác nhận rồi mới làm phase sau. Không gộp nhiều phase vào một lượt để "xong MVP".

### Phase 1 --- Nền tảng local

- Đọc repository.
- Xác định Expo hay React Native CLI, package, script, lint, test và quy ước.
- Không tạo lại project nếu cấu trúc đã có.
- Tạo `ARCHITECTURE.md`, `.env.example` và hướng dẫn chạy nếu chưa có.
- Dựng NestJS, PostgreSQL, Prisma và app mobile nếu chưa có.

**Xong khi:** app và backend chạy local, migration chạy được.

### Phase 2 --- Đăng ký, đăng nhập, đăng xuất

- Register, login, logout, me.
- Vòng đời token và nơi lưu an toàn.
- Validation và mã lỗi ổn định.

**Xong khi:** đăng nhập trên app và gọi được API được bảo vệ.

### Phase 3 --- Hồ sơ

- Đọc và sửa hồ sơ.
- Không thêm trường privacy cấp tài khoản vào User.

**Xong khi:** hồ sơ cá nhân đọc/sửa được và các trường username, tên, avatar, bio hiển thị đúng.

### Phase 4 --- Theo dõi

- Bảng follow.
- Theo dõi, bỏ theo dõi, danh sách và số lượng.
- Chặn tự theo dõi và bản ghi trùng.

**Xong khi:** quan hệ follow một chiều có hiệu lực ngay.

### Phase 5 --- Bài viết text và feed

- Tạo, sửa, xóa bài text.
- `clientPostId`.
- Chọn visibility cho từng bài (`PUBLIC` mặc định hoặc `FOLLOWERS`).
- Feed cursor, chỉ trả bài được phép xem.

**Xong khi:** hai tài khoản kiểm tra được bài `PUBLIC` và `FOLLOWERS`, bao gồm trường hợp cùng một tác giả có hai loại bài.

### Phase 6 --- Ảnh bài viết

- Signed upload Cloudinary.
- Metadata ảnh.
- Hiện ảnh trên feed và chi tiết bài.

**Xong khi:** ảnh đăng được và người không có quyền không nhận URL.

### Phase 7 --- Video bài viết tối đa 30 giây

- Đọc thời lượng ở client.
- Server từ chối video trên 30 giây hoặc thiếu thời lượng.
- Hiện video hợp lệ trên feed.

**Xong khi:** video 30 giây đăng được, video dài hơn bị chặn ở cả hai đầu.

### Phase 8 --- Đăng bài offline

- Bảng local của bài và media, gồm `visibility`.
- Đưa `CREATE_POST`, sửa nội dung, sửa `visibility` và xóa vào `sync_queue`.
- Retry, backoff, idempotency.
- Giữ file local đến khi upload xong.
- Test mất mạng, kill app, mạng chập chờn và retry.

**Xong khi:** toàn bộ acceptance criteria của FR-SOC-09 đạt.

### Phase 9 --- Thích, bình luận, tìm người dùng

- Like idempotent.
- Comment có phân trang.
- Tìm người dùng.
- Mọi thao tác đều kiểm tra quyền xem bài.

**Xong khi:** tương tác và tìm kiếm hoạt động với cả hai mức visibility của bài viết.

### Phase 10 --- Chat 1-1 online

- Hội thoại direct.
- Text qua REST và Socket.IO.
- Lịch sử và phân trang.
- Ảnh và video chat tối đa 30 giây.
- Reconnect và resync cơ bản khi đang online trở lại.

**Xong khi:** hai tài khoản nhắn text và media online ổn định.

### Phase 11 --- Chat 1-1 offline

- Chat đọc từ SQLite trước.
- Hàng đợi tin, retry, idempotency.
- Tải bù tin sau reconnect.
- Hàng đợi media.
- Test mất mạng, kill app, mạng chập chờn và đổi tài khoản.

**Xong khi:** toàn bộ acceptance criteria của FR-CHAT-05 đạt. Đây là cổng trước khi làm cuộc gọi.

### Phase 12 --- Chat nhóm

- Tạo nhóm tối thiểu 3 người.
- Thêm, xóa, rời nhóm, chuyển chủ nhóm, đổi tên.
- Text, ảnh, video tối đa 30 giây.
- Offline sync dùng cùng Sync Engine với chat 1-1.

**Xong khi:** tiêu chí phase 12 ở mục 13 đạt. Không làm gọi nhóm.

### Phase 13 --- Push notification

- Đăng ký token FCM.
- Thông báo tin 1-1 và tin nhóm.
- Thông báo like và comment.
- Điều hướng vào đúng hội thoại.

**Xong khi:** thông báo tới thiết bị và mở đúng màn hình.

### Phase 14 --- Gọi thoại và video 1-1

Chỉ bắt đầu sau khi người dùng xác nhận phase 11 đã xong.

- LiveKit cho gọi thoại và gọi video.
- API token cuộc gọi.
- Signaling cuộc gọi đến.
- Trạng thái lỗi, quyền thiết bị, mất mạng và kết thúc.
- Kiểm tra trên thiết bị thật nếu có điều kiện.

**Xong khi:** cuộc gọi 1-1 hoạt động. Thời lượng cuộc gọi không bị giới hạn 30 giây.

### Phase 15 --- Deepfake hybrid (on-device ưu tiên, server fallback)

Chỉ bắt đầu khi được yêu cầu riêng, sau các phase nền tảng.

- Chọn clip trên máy; từ chối clip dài hơn 10 giây.
- Thử phân tích trên thiết bị trước.
- Nếu on-device không khả dụng hoặc lỗi kỹ thuật, đề xuất server fallback và chỉ upload sau consent rõ ràng.
- Không upload khi offline hoặc khi người dùng từ chối.
- Hiện kết quả cho clip, không gắn vào tài khoản.
- Server fallback không lưu clip lâu dài; xóa file tạm sau khi xử lý theo chính sách retention được chốt ở đầu phase 15.

**Xong khi:** tiêu chí phase 15 ở mục 13 đạt.

### Phase 16 --- Hardening

- Rà soát quyền xem bài và quyền thành viên nhóm.
- Test sync và idempotency.
- Hiệu năng danh sách dài.
- Logging không lộ bí mật.
- Pipeline build mobile.
- Tài liệu chạy dự án.

**Xong khi:** có bản build kiểm thử và tài liệu triển khai local.

------------------------------------------------------------------------

## 15. Hướng dẫn dành cho Cursor Agent

1. Đọc hết PRD trước khi sửa code.
2. Chỉ triển khai một phase. Không làm trước endpoint, bảng, màn hình hoặc dependency của phase sau.
3. Không triển khai deepfake, LiveKit, FCM hoặc chat nhóm khi phase hiện tại chưa tới đó.
4. Không làm ứng dụng web.
5. Không làm mã hóa đầu cuối.
6. Trước khi code một phase, đọc repository và báo cáo công nghệ, cấu trúc, phần đã có, phần còn thiếu so với phase đó, và xung đột với PRD. Chưa sửa file trong bước báo cáo này nếu người dùng chưa bảo triển khai.
7. Không xóa hoặc viết lại code đang có nếu chưa chứng minh cần thiết.
8. Dùng TypeScript strict. Tránh `any` nếu không có lý do.
9. Không để business logic trong React component hoặc NestJS controller.
10. Không hardcode API URL, secret, Cloudinary credential hoặc LiveKit secret.
11. Tạo `.env.example`. Không commit `.env`.
12. Đổi database thì có Prisma migration.
13. Endpoint của phase đang làm phải có validation, auth, kiểm tra quyền và mã lỗi ổn định.
14. Viết test cho logic của phase đang làm. Với phase 8 và 11, test tối thiểu gồm idempotency, queue còn sau khi tái khởi động, retry, resync và cô lập tài khoản.
15. NetInfo báo online chưa đủ để coi server sống. Phải xử lý timeout và lỗi request.
16. Không dùng Socket.IO thay cho database hoặc API đồng bộ.
17. Không lưu file lớn trong SQLite. Chỉ lưu metadata và đường dẫn.
18. Không xóa bài hoặc tin pending, và không xóa file local, trước khi server xác nhận.
19. Mọi API đọc bài phải lọc theo `Post.visibility` và quan hệ follow hiện tại. Không lọc mỗi ở UI.
20. Video tải lên trên 30 giây phải bị từ chối ở client và server.
21. Hết phase, báo cáo file đã tạo hoặc sửa, cách chạy, test đã chạy và kết quả. Sau đó dừng và chờ xác nhận.
22. Nếu yêu cầu mới mâu thuẫn với phase hiện tại, hỏi trước khi mở rộng phạm vi.

### Prompt khởi đầu cho Cursor Agent

```text
Read PRD.md completely before making changes.

Implement only the next uncompleted phase. Do not implement later phases
in the same change. In particular, do not start group chat, push
notifications, LiveKit calls, or on-device deepfake detection early.

There is no web client and no end-to-end encryption.

Before editing, inspect the repository and report:
1. Current structure and technologies.
2. Which phases are already done.
3. The single next phase and its exit criteria.
4. Conflicts with this PRD.

Product rules that apply as soon as their phase starts:
- Follow is instant and one-way. No follow requests.
- Each post has visibility PUBLIC (default) or FOLLOWERS.
- PUBLIC posts are visible to any signed-in user.
- FOLLOWERS posts are visible only to the author and current followers.
- Visibility is stored on Post, not User.
- Username, display name, avatar, and bio stay visible.
- Posts and direct messages created offline stay in SQLite and sync
  automatically, using clientPostId or clientMessageId idempotency.
- Uploaded videos are rejected when duration is missing or greater
  than 30 seconds. Live calls are not capped at 30 seconds.
- Voice and video calls start only after offline 1-1 chat has passed
  its exit criteria and the user confirms.
- Deepfake detection is a final phase. Try on-device inference first for
  clips up to 10 seconds. Server fallback requires explicit user consent
  and must not label a user account.

Wait for approval before implementing the next phase.
```

------------------------------------------------------------------------

## 16. Rủi ro và phương án giảm thiểu

| Rủi ro | Tác động | Giảm thiểu |
| --- | --- | --- |
| Mất mạng lúc gửi bài hoặc tin | Trùng hoặc mất dữ liệu | SQLite queue và idempotency key |
| App bị tắt khi đang sync | Trạng thái lệch | Ghi queue và trạng thái trước khi gửi |
| Socket rơi | Mất event | REST resync bằng cursor |
| Upload media lỗi | Bài hoặc tin media dở | Giữ file local và retry |
| Đổi tài khoản trên một máy | Lộ dữ liệu local | Tách SQLite theo user |
| Đổi visibility bài viết | Máy khác còn cache bài cũ | Server là nguồn đúng; lần sync sau xóa bài không còn quyền xem |
| Follow không cần duyệt | Bài `FOLLOWERS` trở nên xem được ngay sau một lần bấm theo dõi | Đúng với quyết định sản phẩm. UI nói rõ theo dõi xong sẽ xem được bài |
| Secret Cloudinary lộ | Người khác upload hoặc xóa asset | Signed upload, secret chỉ ở backend |
| Làm quá nhiều phase một lúc | Trễ và khó kiểm thử | Dừng sau mỗi phase, chờ xác nhận |
| Làm cuộc gọi trước khi chat offline ổn định | Lệch ưu tiên | Phase 14 khóa bởi tiêu chí phase 11 |
| Video 30 giây bị vượt | Sai phạm vi media | Chặn ở client và server |
| Deepfake bị làm sớm hoặc gắn nhãn người dùng | Sai phạm vi và rủi ro sản phẩm | Chỉ phase 15, clip tối đa 10 giây, không nhãn tài khoản |
| Clip bị upload khi chưa đồng ý | Rủi ro riêng tư | On-device trước; server fallback cần consent rõ ràng, truyền HTTPS và xóa file tạm theo retention đã chốt |

------------------------------------------------------------------------

## 17. Giả định và câu hỏi đã đóng

Các câu hỏi mở của bản 1.0 được chốt như sau:

1. **Có làm web trong phạm vi hiện tại không?** Không. Chỉ mobile iOS và Android.
2. **Quan hệ người dùng là gì?** Theo dõi một chiều, có hiệu lực ngay, không duyệt. Không làm kết bạn.
3. **Ai được xem bài?** Mỗi bài có visibility riêng: `PUBLIC` là mặc định, mọi người đã đăng nhập được xem; `FOLLOWERS` chỉ tác giả và người đang theo dõi tác giả được xem. Tên, avatar và bio vẫn hiện. Một tài khoản có thể có cả hai loại bài.
4. **Cuộc gọi có làm ngay không?** Không. Làm sau khi chat offline 1-1 đạt tiêu chí thoát và được xác nhận.
5. **Có chat nhóm không?** Có, là phase riêng sau chat 1-1 offline. Không có gọi nhóm.
6. **Có mã hóa đầu cuối không?** Không.
7. **Video dài bao nhiêu?** Video tải lên ở bài viết và chat tối đa 30 giây. Cuộc gọi không bị giới hạn này.
8. **Deepfake làm đến đâu?** Phase cuối, ưu tiên on-device cho clip tối đa 10 giây; server fallback chỉ sau khi thông báo và được người dùng đồng ý. Không làm trong các phase nền tảng.

Giả định còn lại:

- PostgreSQL là database server duy nhất.
- SQLite là database local trên mobile.
- Cloudinary lưu ảnh và video tải lên.
- LiveKit chỉ dùng ở phase gọi 1-1.
- Người xem bài và người chat đều đã đăng nhập. Không có khách xem công khai qua web.
- Thành viên mới của nhóm xem được lịch sử tin đang có trên server.
- Nhóm phải có tối thiểu 3 thành viên đang active khi tạo, tính cả người tạo; nhóm sau đó có thể còn dưới 3 người khi thành viên rời.
- Like, comment và đổi thành viên nhóm cần mạng trong các phase đã xếp.

Chưa cần chốt trước khi làm các phase đầu:

- Chính sách độ mạnh của mật khẩu, miễn là có một chính sách được cấu hình.
- Dung lượng file tối đa, miễn là có giới hạn ở backend và vẫn chứa được một video 30 giây hợp lệ.
- Thư viện cụ thể của phase deepfake và chính sách retention của server fallback. Chốt ở đầu phase 15.

------------------------------------------------------------------------

## 18. Quyết định sản phẩm quan trọng

**Làm từng phase và dừng để xác nhận.** Không triển khai toàn bộ lộ trình trong một lượt. Phase sau chưa được tạo "cho đủ".

**Dữ liệu người dùng tạo ra không được mất.** Bài viết và tin nhắn được ghi vào SQLite trước khi coi là đã nhận thao tác gửi. Có mạng thì Sync Engine đẩy lên backend. `clientPostId` và `clientMessageId` giúp retry không tạo bản ghi trùng. Socket.IO chỉ để realtime. PostgreSQL là nơi lưu chính thức.

**Quyền xem bài nằm trên từng bài viết.** `PUBLIC` là mặc định và mọi người đã đăng nhập được xem; `FOLLOWERS` chỉ cho tác giả và người đang theo dõi tác giả xem. Một tài khoản có thể có bài ở cả hai chế độ. Theo dõi không cần duyệt. Chat không dùng quyền này làm điều kiện gửi.

**Cuộc gọi đứng sau chat offline.** Phase gọi chỉ mở khi chat 1-1 offline đã đạt tiêu chí và người dùng xác nhận. Chat nhóm làm trước cuộc gọi, và không gồm gọi nhóm.

**Không có web và không có mã hóa đầu cuối.**

**Video tải lên dài tối đa 30 giây.** Giới hạn này không áp vào cuộc gọi.

**Deepfake là phase cuối.** Ưu tiên phân tích trên thiết bị với clip tối đa 10 giây; nếu không khả dụng thì server fallback chỉ được dùng sau khi người dùng đồng ý rõ ràng. Không gắn kết quả vào một tài khoản và không được làm sớm.
