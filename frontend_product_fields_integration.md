# 商品新字段前端集成任务列表

此文件用于跟踪将商品的原价、折扣和优惠券相关字段集成到管理后台前端的任务。

## 任务清单 (Implementation Checklist)

**类型定义**

- [ ] 更新 `apps/admin/src/lib/services/product.service.ts` 中的 `Product`, `CreateProductData`, `UpdateProductData` 类型定义，添加新字段 (`originalPrice`, `discount`, `coupon`, `couponDescription`, `couponExpirationDate`)。

**商品列表页 (`apps/admin/src/app/[locale]/products/page.tsx`, `.../products-client.tsx`)**

- [ ] 修改价格列 (`TableCell`)，增加显示划线原价的逻辑（如果适用）。
- [ ] 添加原价的 `TableHead` 和 `TableCell`。
- [ ] 实现 `handleUpdateProductOriginalPrice` 函数。
- [ ] 在新的 `TableCell` 中使用 `ProductsClient.QuickEdit` 并传入正确的 props 来编辑原价。

**编辑/新建商品页 (`apps/admin/.../edit-product-client.tsx`, `.../new-product-client.tsx`)**

- [ ] 在表单中添加 `originalPrice` 输入字段和标签。
- [ ] 在表单中添加 `discount` 输入字段和标签。
- [ ] 在表单中添加 `coupon` 输入字段和标签。
- [ ] 在表单中添加 `couponDescription` Textarea 字段和标签。
- [ ] 在表单中添加 `couponExpirationDate` 的 DatePicker 组件和标签。
- [ ] 更新表单状态管理逻辑以包含新字段。
- [ ] 更新表单提交逻辑，将新字段的值传递给 API 调用。

**国际化 (i18n)**

- [ ] 更新相关的国际化文件 (`apps/admin/src/messages/*.json`)，添加新字段的翻译。
