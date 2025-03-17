import type { Metadata } from "next";

import { NewProductClient } from "./new-product-client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "Add Product | E-commerce Aggregation Admin",
  description: "Add a new product",
};

export default function NewProductPage() {
  return (
    <NewProductClient.PageWrapper>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Add New Product</h2>
      </div>
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="product-name">Product Name</Label>
                  <Input id="product-name" placeholder="Enter product name" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="product-description">Description</Label>
                  <Textarea
                    id="product-description"
                    placeholder="Enter product description"
                    className="min-h-32"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="product-brand">Brand</Label>
                    <Select>
                      <SelectTrigger id="product-brand">
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nike">Nike</SelectItem>
                        <SelectItem value="adidas">Adidas</SelectItem>
                        <SelectItem value="puma">Puma</SelectItem>
                        <SelectItem value="levis">Levi&apos;s</SelectItem>
                        <SelectItem value="hm">H&M</SelectItem>
                        <SelectItem value="zara">Zara</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="product-category">Category</Label>
                    <Select>
                      <SelectTrigger id="product-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="footwear">Footwear</SelectItem>
                        <SelectItem value="apparel">Apparel</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="home">Home & Living</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="product-tags">Tags</Label>
                  <Input
                    id="product-tags"
                    placeholder="Enter tags separated by commas"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label>Product Images</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 p-4 hover:bg-gray-50">
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-md">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-10 w-10 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        <span className="mt-2 text-sm text-gray-500">
                          Add Image
                        </span>
                      </div>
                    </div>
                    <div className="relative h-40 rounded-md border bg-gray-100">
                      <img
                        src="/placeholder.svg?height=160&width=160"
                        alt="Product preview"
                        className="h-full w-full rounded-md object-cover"
                      />
                      <button className="absolute right-2 top-2 rounded-full bg-white p-1 shadow-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="product-price">Price</Label>
                    <Input
                      id="product-price"
                      placeholder="0.00"
                      type="number"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="product-compare-price">
                      Compare at Price
                    </Label>
                    <Input
                      id="product-compare-price"
                      placeholder="0.00"
                      type="number"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="product-cost">Cost per item</Label>
                    <Input id="product-cost" placeholder="0.00" type="number" />
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="product-tax">Tax Class</Label>
                  <Select>
                    <SelectTrigger id="product-tax">
                      <SelectValue placeholder="Select tax class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="reduced">Reduced Rate</SelectItem>
                      <SelectItem value="zero">Zero Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <div className="flex justify-end space-x-2 pt-4">
          <NewProductClient.SaveDraftButton />
          <NewProductClient.PublishButton />
        </div>
      </Tabs>
    </NewProductClient.PageWrapper>
  );
}
