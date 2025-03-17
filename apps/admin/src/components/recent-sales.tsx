import { Avatar } from "@heroui/react";

export function RecentSales() {
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <Avatar
          src="/placeholder.svg?height=36&width=36"
          alt="Jackson Lee"
          name="Jackson Lee"
          size="md"
          className="h-9 w-9"
        />
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Jackson Lee</p>
          <p className="text-sm text-muted-foreground">
            jackson.lee@example.com
          </p>
        </div>
        <div className="ml-auto font-medium">+$1,999.00</div>
      </div>
      <div className="flex items-center">
        <Avatar
          src="/placeholder.svg?height=36&width=36"
          alt="Sophia Davis"
          name="Sophia Davis"
          size="md"
          isBordered
          className="h-9 w-9"
        />
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Sophia Davis</p>
          <p className="text-sm text-muted-foreground">
            sophia.davis@example.com
          </p>
        </div>
        <div className="ml-auto font-medium">+$39.00</div>
      </div>
      <div className="flex items-center">
        <Avatar
          src="/placeholder.svg?height=36&width=36"
          alt="William Kim"
          name="William Kim"
          size="md"
          className="h-9 w-9"
        />
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">William Kim</p>
          <p className="text-sm text-muted-foreground">
            william.kim@example.com
          </p>
        </div>
        <div className="ml-auto font-medium">+$299.00</div>
      </div>
      <div className="flex items-center">
        <Avatar
          src="/placeholder.svg?height=36&width=36"
          alt="Olivia Martinez"
          name="Olivia Martinez"
          size="md"
          className="h-9 w-9"
        />
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Olivia Martinez</p>
          <p className="text-sm text-muted-foreground">
            olivia.martinez@example.com
          </p>
        </div>
        <div className="ml-auto font-medium">+$99.00</div>
      </div>
      <div className="flex items-center">
        <Avatar
          src="/placeholder.svg?height=36&width=36"
          alt="Ethan Thompson"
          name="Ethan Thompson"
          size="md"
          className="h-9 w-9"
        />
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Ethan Thompson</p>
          <p className="text-sm text-muted-foreground">
            ethan.thompson@example.com
          </p>
        </div>
        <div className="ml-auto font-medium">+$149.00</div>
      </div>
    </div>
  );
}
