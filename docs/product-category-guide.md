# TrendHub 产品分类开发指南

## 1. 引言

产品分类是 TrendHub 电商聚合平台的核心功能之一，它直接影响用户浏览、搜索商品以及商品数据分析的准确性和效率。一个清晰、结构合理且易于管理的分类系统对于提升用户体验和运营效率至关重要。

本文档旨在为 TrendHub 项目的开发和维护人员提供关于产品分类功能的全面指南。内容将涵盖分类的核心概念、数据库模型设计、后端处理逻辑、前端交互实现，以及近期针对分类功能所做的重要调整和优化。通过本指南，希望能确保团队成员对分类系统有统一的理解，从而在后续的开发工作中保证代码质量和功能的一致性。

## 2. 核心概念

理解以下核心概念对于掌握 TrendHub 的产品分类系统至关重要：

- **层级分类 (Hierarchical Categories)**：
  TrendHub 采用多层级的分类体系来组织商品。这意味着一个分类可以拥有父分类和子分类，形成一个树状结构。这种结构允许我们更细致地划分商品，满足不同粒度的浏览和筛选需求。

- **面包屑 (Breadcrumbs)**：
  面包屑是商品在源电商网站上所属分类路径的文本表示，通常以数组形式提供，例如 `["Women", "Clothing", "Dresses", "Mini Dresses"]`。这是我们系统获取产品原始分类信息、并自动创建或关联到对应分类层级的主要依据。

- **性别分类 (Gender Categories)**：
  在 TrendHub 的分类体系中，一级分类（即树的根节点或接近根节点的层级）通常被设计为性别分类，主要包括 "Women" (女士), "Men" (男士), 和 "Kids" (儿童)。这是为了确保商品首先能按照最基本的用户群体进行划分。后端逻辑会尝试从产品 URL 或面包屑的首项来识别或注入性别分类。

- **品牌过滤 (Brand Filtering)**：
  在根据产品面包屑自动生成或关联分类的过程中，系统会尝试识别并过滤掉其中包含的品牌名称。这是因为品牌信息由单独的 `Brand` 模型及与 `Product` 的关联进行管理，不应重复作为分类层级存在，以避免数据冗余和分类结构混乱。例如，如果面包屑是 `["Women", "Gucci", "Handbags"]`，且 "Gucci" 是一个已知的品牌，那么在创建分类时 "Gucci" 这一项将被忽略。

- **动态层级深度 (Dynamic Level Depth)**：
  虽然前端UI（尤其是在产品编辑和新建时的分类选择器）目前主要围绕三级进行交互设计，但后端的数据模型和分类创建逻辑支持并记录分类的实际层级深度。这意味着一个产品可以被关联到一个在数据库中层级为 L4、L5 或更深的分类。前端会通过特定方式展示这种精确的深层分类信息。

## 3. 数据库模型 (`Category` Model)

产品分类的数据结构在 Prisma Schema 中定义，具体路径为 `apps/admin/prisma/schema.prisma`。

以下是 `Category` 模型的核心定义：

```prisma
model Category {
  id          String     @id @default(cuid())  // 唯一标识符，使用 CUID
  name        String                           // 分类名称 (例如 "Dresses", "Tops")
  slug        String     @unique               // URL 友好的唯一标识符 (例如 "women-clothing-dresses")
  description String?                          // 分类描述（可选）
  level       Int                              // 分类层级深度 (从1开始，1代表根级或顶级分类)
  parentId    String?                          // 父级分类的ID (如果为 null，则为顶级分类)
  parent      Category?  @relation("SubCategories", fields: [parentId], references: [id]) // 关联到父分类
  children    Category[] @relation("SubCategories") // 关联到所有直接子分类
  image       String?                          // 分类图片URL（可选）
  isActive    Boolean    @default(true)        // 分类是否激活并在前台显示
  products    Product[]                        // 与该分类直接关联的商品列表
  createdAt   DateTime   @default(now())       // 创建时间戳
  updatedAt   DateTime   @updatedAt            // 最后更新时间戳

  // 数据库索引，用于优化查询性能
  @@index([parentId])
  @@index([level])
  @@index([isActive])
}
```

**关键字段说明**：

- `id`: 每个分类的唯一标识符。
- `name`: 用户可见的分类名称。
- `slug`: 这是分类在URL和内部查找时的唯一键。它的生成规则是基于其所有父级分类的 `slug` 和当前分类自身的 `name` 进行组合，并进行URL友好化处理（例如，将 "Women" -> "Clothing" -> "Dresses" 的 `slug` 生成为 `women-clothing-dresses`）。这种累积式的 `slug` 确保了全局唯一性，并能从 `slug` 中大致反推出其层级关系。
- `level`: 代表该分类在层级树中的深度。根级分类（如 "Women", "Men"）的 `level` 为 `1`。其直接子分类的 `level` 为 `2`，以此类推。此字段记录的是分类的实际层级，不受前端UI三级选择器的限制。
- `parentId`: 指向其直接父分类的 `id`。如果一个分类是顶级分类（如性别分类），则其 `parentId` 为 `null`。
- `parent` 和 `children`: 这两个关系字段用于在代码中方便地导航分类树的父子关系。
- `isActive`: 控制该分类是否在前台对用户可见和可用。
- `products`: 列出所有直接归属于此分类的商品。注意，一个商品只直接关联到一个最精确的叶子分类，但可以通过分类的层级关系找到其所有父分类下的商品。

通过 `parentId` 和 `children` 字段，`Category` 模型自然地形成了一个树状结构，可以支持任意深度的分类层级。

## 4. 后端分类处理逻辑

后端对产品分类的主要处理逻辑集中在商品数据抓取和导入的过程中，特别是如何根据源网站提供的面包屑信息来创建或关联到系统内的分类。

**主要涉及文件**: `apps/admin/src/app/api/scraping/[site]/route.ts`

### 4.1. `getOrCreateCategoryId` 函数详解

此函数是分类创建的核心。当从外部源（如电商网站）抓取到一个新的产品数据时，会调用此函数来为其确定或创建对应的分类ID。

**函数签名 (简化后)**:
`async function getOrCreateCategoryId(breadcrumbsInput?: string[], productBrandName?: string): Promise<string>`

**核心处理步骤**:

1.  **参数准备与清洗**:

    - `breadcrumbsInput`: 从爬虫获取到的原始面包屑字符串数组。
    - `productBrandName` (可选): 该产品的品牌名称。
    - 函数首先会对 `breadcrumbsInput` 进行清洗，去除空项和首尾空格。

2.  **性别分类预处理 (在调用 `getOrCreateCategoryId` 之前)**:
    在 `POST` 主处理函数中，调用 `getOrCreateCategoryId` 之前，有一段逻辑专门处理性别分类的注入：

    - 它会检查传入的 `breadcrumbsInput` (此时为 `processedBreadcrumbs`) 是否已经包含了已知的性别关键词（如 "Women", "Men", "Kids"）。
    - 如果面包屑中**不包含**这些性别关键词，系统会调用 `inferGenderFromUrl(productData.url)` 函数，尝试从产品的URL中推断出性别分类。
    - 如果成功推断出性别（例如从URL `/en/women/category/product-name` 中推断出 "Women"），则会将这个推断出的性别分类作为**第一项**插入到 `processedBreadcrumbs` 数组的开头。
    - 这样处理后的 `processedBreadcrumbs` 才作为 `breadcrumbsInput` 传递给 `getOrCreateCategoryId`。
    - **目的**: 确保分类的根层级尽可能地是标准的性别分类，即使原始数据中缺失这一信息。

3.  **品牌名过滤**:

    - 在 `getOrCreateCategoryId` 函数内部，如果调用时传入了 `productBrandName` 参数，函数会遍历当前的 `breadcrumbs` 数组。
    - 它会将面包屑数组中与 `productBrandName` (忽略大小写比较) 相同的项过滤掉。
    - **目的**: 防止将已知的品牌名称错误地创建为一个独立的分类层级，因为品牌信息由 `Product.brandId` 单独管理。

4.  **处理空面包屑**:

    - 经过上述处理后，如果面包屑数组变为空（例如，原始面包屑只包含品牌名，或本身就为空且未能推断出性别分类），系统会查找或创建一个名为 "Default Category" (slug: `default-category`) 的一级分类，并返回其ID。

5.  **逐级创建/更新分类层级**:

    - 如果面包屑数组不为空，函数会从 `currentLevel = 1` 和 `currentParentId = null` 开始，遍历数组中的每一个有效面包屑项 (`categoryNamePart`)。
    - **`generateSlug(name: string)`**: 辅助函数，用于将 `categoryNamePart` 转换为URL友好的slug片段 (小写，空格转连字符，移除特殊字符等)。
    - **累积式 Slug (`finalCompositeSlug`)**: 对于每个 `categoryNamePart`，其最终的 `slug` 是通过将其父级分类的完整 `slug` (如果存在)与当前项生成的 `slug` 片段用连字符 `-` 连接而成。例如：
      - "Women" -> `women`
      - "Clothing" (父为 "Women") -> `women-clothing`
      - "Tops" (父为 "Clothing"，爷为 "Women") -> `women-clothing-tops`
    - **数据库操作 (`db.category.upsert`)**:
      - 使用 `finalCompositeSlug`作为 `where: { slug: finalCompositeSlug }` 条件进行 `upsert` (即如果该slug已存在则更新，不存在则创建)。
      - **创建时 (`create`)**:
        - `name`: 当前的 `categoryNamePart`。
        - `slug`: `finalCompositeSlug`。
        - `level`: 当前的 `currentLevel`。
        - `parentId`: 上一轮循环得到的 `currentParentId`。
        - `isActive`: 默认为 `true`。
      - **更新时 (`update`)**: 主要确保 `name` 和 `isActive` 状态正确。
    - **迭代**: `upsert` 操作成功后，新创建或更新的分类的 `id` 会成为下一轮循环的 `currentParentId`，并且 `currentLevel` 会加1。

6.  **返回结果**:
    - 循环结束后，函数返回最后一次 `upsert` 操作得到的分类ID。这个ID即为产品最终应该关联的最深层级（或最精确）的分类ID。

### 4.2. `inferGenderFromUrl` 函数

- 一个简单的辅助函数，输入产品URL字符串。
- 通过检查URL中是否包含特定关键词 (如 `/women/`, `/men/`, `/kids/` 等，不区分大小写) 来推断性别分类。
- 返回推断出的性别字符串 (如 "Women") 或 `null`。

**总结**：后端逻辑的目标是尽可能准确和结构化地从原始、多样化的面包屑数据中提取分类信息，确保性别分类的优先处理，避免品牌冗余，并建立一个层级清晰、可通过唯一slug寻址的分类树。产品最终会关联到这个处理流程所产生的最叶子节点的分类ID。

## 5. 前端分类选择与显示 (`CascadeCategorySelector`)

前端的产品分类选择功能主要由 `CascadeCategorySelector` 组件提供，该组件用于产品新建和编辑页面，允许用户为产品指定分类。

**主要涉及文件**: `apps/admin/src/app/[locale]/products/products-client.tsx`

**组件核心功能与逻辑**:

1.  **三级下拉选择器**:

    - UI上提供三个串联的下拉选择框，分别对应分类层级的一级、二级和三级。

2.  **选项列表的动态生成**:

    - **一级分类选项 (`level1Categories`)**: 数据来源于 `categories` prop 中所有 `parentId` 为 `null` 的分类（即所有根级分类，通常是 "Women", "Men" 等性别分类）。
    - **二级分类选项 (`level2Categories`)**: 数据来源于 `categories` prop 中所有 `parentId` 等于当前一级选择框选中值 (`level1Value`) 的分类。
    - **三级分类选项 (`level3Categories`)**: 数据来源于 `categories` prop 中所有 `parentId` 等于当前二级选择框选中值 (`level2Value`) 的分类。
    - 这些选项列表通过 `useMemo` 进行计算，当依赖的选中值或总分类列表变化时会自动更新。

3.  **初始化选中状态 (基于产品当前分类ID)**:

    - 组件通过 `useEffect` Hook 来初始化三个下拉框的选中状态。它依赖于传入的 `value` prop (即产品当前关联的 `categoryId`) 和 `categories` prop (包含所有分类信息的扁平数组)。
    - **处理逻辑**:
      1.  首先，根据 `value` 从 `categories` 数组中找到产品当前直接关联的分类 (`targetCategory`)。
      2.  然后，从 `targetCategory` 开始，**向上递归追溯**其所有的父级分类，直到最顶层的根分类（其 `parentId` 为 `null`）。这个追溯过程会构建出一个从根到 `targetCategory` 的完整祖先路径数组 (`ancestorPath`)。
      3.  根据 `ancestorPath` 的内容来设置三个下拉框的选中值：
          - `setLevel1Value(ancestorPath.length >= 1 ? ancestorPath[0].id : null)`: 将路径中的第一个分类（即根分类，如 "Women"）的ID设置为一级下拉框的选中值。
          - `setLevel2Value(ancestorPath.length >= 2 ? ancestorPath[1].id : null)`: 将路径中的第二个分类的ID设置为二级下拉框的选中值。
          - `setLevel3Value(ancestorPath.length >= 3 ? ancestorPath[2].id : null)`: 将路径中的第三个分类的ID设置为三级下拉框的选中值。
      - **效果**: 这种方式确保了即使用户编辑的是一个在数据库中层级较深（例如L4或L5）的产品，前端的三个下拉框也会正确地显示并选中其分类路径的前三层（从根开始）。例如，如果产品属于 "Women > Clothing > Tops > Shirts" (L4)，则一级选 "Women"，二级选 "Clothing"，三级选 "Tops"。

4.  **显示产品精确的完整分类路径**:

    - 为了弥补三级选择器在UI上无法直接选择或完全展示超过三层分类的局限性，组件在 `useEffect` 中还会根据 `ancestorPath` 生成一个表示产品完整分类路径的字符串（例如："Women > Clothing > Tops > Shirts"）。
    - 这个路径字符串通过 `displayFullPathString` 状态存储，并在三级下拉框的下方通过一个文本元素展示给用户。
    - 文本标签使用 `t("currentFullPathLabel")` 进行国际化。
    - **目的**: 即使用户只能通过UI直接操作前三级分类，也能清晰地了解到产品当前实际所属的、可能更深的精确分类。

5.  **用户交互与分类更改**:
    - 当用户在任一级下拉框中做出新的选择时：
      - `handleLevel1Change`, `handleLevel2Change`, `handleLevel3Change` 会被触发。
      - 这些函数会更新对应层级的 `levelXValue` 状态。
      - 同时，它们会清空所有更深层级的选中状态（例如，修改一级选择会清空二、三级；修改二级会清空三级）。
      - 最后，会调用 `onCategoryChange` prop (由父组件传入)，将当前选中的最深层级的分类ID传递出去，以便父组件更新产品数据。

**总结**: `CascadeCategorySelector` 组件通过上述机制，在提供标准三级分类选择界面的同时，努力确保了：

- 对于具有深层级分类的产品，其根相关的三层分类能被正确回显。
- 用户能明确知晓产品当前完整且精确的分类归属。
- 选择逻辑保持了层级联动性。

这种设计是在固定三级选择UI与支持更深层级数据之间的一个平衡和优化。

## 6. 开发与维护指南

为了确保产品分类功能的稳定性和一致性，请遵循以下指南：

- **添加新分类时的注意事项**:

  - **通过UI添加**: 在后台管理界面添加分类时，系统会引导您选择父分类并自动处理 `level` 和 `slug`。请尽量使用UI进行操作。
  - **通过脚本/数据库操作**: 如果需要批量导入或直接修改数据库：
    - 确保 `slug` 的全局唯一性。推荐遵循现有的累积式slug生成规则（`parent-slug-current-name-slug`）。
    - 正确设置 `level`，它应该等于其父分类的 `level + 1` (顶级分类的 `level` 为1)。
    - 正确设置 `parentId`，指向其直接父分类的 `id`。

- **处理新的电商网站源 (爬虫适配)**:

  - **分析面包屑**: 当接入新的商品来源时，首先要仔细分析其产品详情页提供的面包屑 (breadcrumbs) 结构。注意其层级深度、是否包含品牌名、是否有明确的性别分类等。
  - **性别分类推断**: 如果新源的URL结构有助于推断性别分类，可以考虑更新 `apps/admin/src/app/api/scraping/[site]/route.ts` 中的 `inferGenderFromUrl` 函数的逻辑，或者为其添加特定站点的推断规则。
  - **品牌词典 (如果需要)**: 如果新源的品牌名经常混杂在面包屑中且不易通过简单字符串匹配过滤，可以考虑维护一个品牌词典用于更精确的过滤（目前系统是直接使用产品本身的品牌名进行过滤）。
  - **测试**: 充分测试新源产品的导入流程，检查分类是否按预期创建和关联，特别注意边界情况（如很深或很浅的面包屑、包含特殊字符的面包屑等）。

- **UI自定义与扩展**:

  - **当前局限性**: `CascadeCategorySelector` 目前提供的是固定的三级选择界面。虽然它可以正确显示深层级分类的根三层并提示完整路径，但用户不能直接通过它选择到例如L4或L5的分类。如果产品需要被归类到L3之后的层级，目前主要依赖于初次导入时面包屑的自动处理。
  - **未来扩展可能**: 如果业务需求强烈要求在UI上直接、方便地选择和管理超过三级的分类，那么 `CascadeCategorySelector` 组件将需要进行较大规模的重构。可以考虑替换为成熟的第三方树形选择组件，或者自行实现一个支持动态加载和无限层级的选择器。
  - 对 `CategoryTable` (`apps/admin/src/app/[locale]/products/category-table.tsx`) 的维护也应考虑到可能存在的深层级分类的展示和操作。

- **数据一致性与维护**:

  - **定期审查**: 建议定期（例如通过数据库查询或脚本）审查 `Category` 表中的数据：
    - 查找是否有 `slug` 重复的异常情况（理论上不应发生）。
    - 检查 `level` 和 `parentId` 是否逻辑一致（例如，`level=1` 的分类其 `parentId` 必须为 `null`；子分类的 `level` 应该是父分类的 `level+1`）。
    - 查找并处理孤立的分类（即不再有产品使用，也没有子分类，且业务上不再需要的）。
  - **品牌与分类分离**: 再次强调，品牌名不应该作为分类存在。如果发现有分类的 `name` 与 `Brand` 表中的品牌名重复，应评估是否需要清理，并将相关产品直接关联到品牌，同时调整其分类到更合适的层级。

- **国际化 (i18n)**:
  - 所有面向用户的分类名称和UI文本都应通过 `next-intl` 进行国际化处理。
  - 分类相关的翻译文本主要位于 `apps/admin/src/messages/[locale].json` 中的 `categories` 和 `product.edit.organization` 等模块下。
  - 新增UI元素或标签时，务必在相应的JSON文件中添加翻译键值对。

## 7. 未来展望 (可选)

随着业务的发展，产品分类系统可以考虑以下方向的增强：

- **更智能化的面包屑解析**:
  - 引入更高级的规则引擎或机器学习模型来分析和理解面包屑的语义，从而更准确地将其映射到预定义的分类属性或层级，而不是简单地逐级创建。
  - 例如，自动识别面包屑中的颜色、材质、系列等属性，并将其存入产品的对应字段，而不是创建为分类。
- **可视化分类树管理工具**:
  - 开发一个更直观的后台界面，允许管理员通过拖拽等方式方便地调整分类结构、合并分类、批量移动产品等。
- **多套分类法支持**:
  - 对于某些特定场景，可能需要支持平行或辅助的分类体系（例如，按用途、风格等），这需要对当前模型和逻辑进行扩展。
- **前端选择器的完全动态化**:
  - 彻底重构分类选择组件，使其能无缝支持任意深度的分类选择和管理，不再局限于三级。

遵循本指南将有助于保持TrendHub产品分类系统的健壮性、可维护性和可扩展性。
