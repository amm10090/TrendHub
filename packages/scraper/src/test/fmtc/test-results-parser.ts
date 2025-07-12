/**
 * FMTC 结果解析器测试
 */

import { chromium } from "playwright";
import { Log } from "crawlee";
import { FMTCResultsParser } from "../../sites/fmtc/results-parser.js";

async function testResultsParser() {
  console.log("🧪 开始测试 FMTC 结果解析器");

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const log = new Log({ level: 4 }); // DEBUG level

  try {
    // 模拟搜索结果页面HTML（基于真实结构）
    const mockHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Program Directory - FMTC</title>
    </head>
    <body>
      <div class="dataTables_info" id="program_directory_table_info">
        Showing 1 to 10 of 57 entries
      </div>
      
      <table id="program_directory_table" class="table fmtc-table table-striped table-sm table-bordered table-hover mx-auto border dataTable no-footer">
        <thead>
          <tr role="row">
            <th>Name</th>
            <th>Country</th>
            <th>Network</th>
            <th>Date Added</th>
          </tr>
        </thead>
        <tbody>
          <tr role="row" class="odd">
            <td>
              <a href="/cp/program_directory/details/m/84646/iHome-Dental-US">iHome Dental (US)</a>
            </td>
            <td>US</td>
            <td>Awin</td>
            <td>2025/07/11</td>
          </tr>
          <tr role="row" class="even">
            <td>
              <a href="/cp/program_directory/details/m/84647/Fashion-Store-UK">Fashion Store (UK)</a>
            </td>
            <td>UK</td>
            <td>Commission Junction</td>
            <td>2025/07/10</td>
          </tr>
          <tr role="row" class="odd">
            <td>
              <a href="/cp/program_directory/details/m/84648/Tech-Gadgets-CA">Tech Gadgets (CA)</a>
            </td>
            <td>CA</td>
            <td>ShareASale</td>
            <td>2025/07/09</td>
          </tr>
        </tbody>
      </table>
      
      <div class="dataTables_paginate paging_simple_numbers" id="program_directory_table_paginate">
        <a class="paginate_button previous disabled" aria-controls="program_directory_table" data-dt-idx="0" tabindex="-1" id="program_directory_table_previous">Previous</a>
        <span>
          <a class="paginate_button current" aria-controls="program_directory_table" data-dt-idx="1" tabindex="0">1</a>
          <a class="paginate_button " aria-controls="program_directory_table" data-dt-idx="2" tabindex="0">2</a>
          <a class="paginate_button " aria-controls="program_directory_table" data-dt-idx="3" tabindex="0">3</a>
        </span>
        <a class="paginate_button next" aria-controls="program_directory_table" data-dt-idx="4" tabindex="0" id="program_directory_table_next">Next</a>
      </div>
    </body>
    </html>
    `;

    // 设置页面内容
    await page.setContent(mockHTML);

    // 创建解析器实例
    const parser = new FMTCResultsParser(page, log);

    console.log("📊 调试页面结构");
    await parser.debugResultsStructure();

    console.log("🔍 解析搜索结果");
    const results = await parser.parseSearchResults();

    console.log("📋 解析结果:");
    console.log(JSON.stringify(results, null, 2));

    // 测试分页信息
    console.log("📄 获取分页信息");
    const paginationInfo = await parser.getPaginationInfo();
    console.log("分页信息:", paginationInfo);

    // 测试导出功能
    console.log("📤 测试导出功能");
    const jsonExport = parser.exportToJson(results);
    console.log("JSON导出长度:", jsonExport.length);

    const csvExport = parser.exportToCsv(results);
    console.log("CSV导出预览:", csvExport.substring(0, 200) + "...");

    // 验证结果
    if (results.merchants.length === 3) {
      console.log("✅ 成功解析了 3 个商户");

      const firstMerchant = results.merchants[0];
      if (
        firstMerchant.name === "iHome Dental (US)" &&
        firstMerchant.country === "US" &&
        firstMerchant.network === "Awin" &&
        firstMerchant.dateAdded === "2025/07/11" &&
        firstMerchant.detailUrl?.includes("/m/84646/")
      ) {
        console.log("✅ 第一个商户数据解析正确");
      } else {
        console.log("❌ 第一个商户数据解析错误");
        console.log("实际数据:", firstMerchant);
      }

      if (
        results.totalCount === 57 &&
        results.currentPage === 1 &&
        results.hasNextPage
      ) {
        console.log("✅ 分页信息解析正确");
      } else {
        console.log("❌ 分页信息解析错误");
        console.log("实际分页数据:", {
          totalCount: results.totalCount,
          currentPage: results.currentPage,
          hasNextPage: results.hasNextPage,
        });
      }
    } else {
      console.log(
        "❌ 商户数量解析错误，期望 3 个，实际",
        results.merchants.length,
      );
    }
  } catch (error) {
    console.error("❌ 测试失败:", error);
  } finally {
    await browser.close();
  }
}

// 运行测试
if (import.meta.url === new URL(process.argv[1], "file://").href) {
  testResultsParser().catch(console.error);
}

export { testResultsParser };
