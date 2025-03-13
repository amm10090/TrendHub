import { formatDate } from "@trend-hub/utils";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Navbar,
  NavbarBrand,
  NavbarContent,
} from "@heroui/react";

import type { JSX } from "react";

export default function AdminPage(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar>
        <NavbarBrand>
          <p className="font-bold text-inherit">TrendHub Admin</p>
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <Button color="primary" variant="light">
            仪表盘
          </Button>
          <Button color="primary" variant="light">
            用户管理
          </Button>
          <Button color="primary" variant="light">
            内容管理
          </Button>
        </NavbarContent>
      </Navbar>

      <div className="flex-grow container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="flex gap-3">
            <div className="flex flex-col">
              <p className="text-xl font-bold">管理员控制台</p>
              <p className="text-small text-default-500">系统管理与数据分析</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            <p>欢迎来到TrendHub管理后台！</p>
            <p>当前时间：{formatDate(new Date())}</p>
          </CardBody>
          <Divider />
          <CardFooter>
            <Button color="primary">查看统计数据</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
