import type { Metadata } from "next";
import Link from "next/link";

import { ProductsClient } from "./products-client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Products | E-commerce Aggregation Admin",
  description: "Manage your products",
};

export default function ProductsPage() {
  return (
    <ProductsClient.PageWrapper>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Products</h2>
        <div className="flex items-center space-x-2">
          <Link href="/products/new">
            <ProductsClient.AddButton />
          </Link>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.brand}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="text-right">
                  ${product.price.toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  <div
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      product.status === "In Stock"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {product.status}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <ProductsClient.ActionMenu product={product} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ProductsClient.PageWrapper>
  );
}

const products = [
  {
    id: "1",
    name: "Nike Air Max 270",
    brand: "Nike",
    category: "Footwear",
    price: 150.0,
    status: "In Stock",
  },
  {
    id: "2",
    name: "Adidas Ultraboost 21",
    brand: "Adidas",
    category: "Footwear",
    price: 180.0,
    status: "In Stock",
  },
  {
    id: "3",
    name: "Puma RS-X Toys",
    brand: "Puma",
    category: "Footwear",
    price: 120.0,
    status: "Low Stock",
  },
  {
    id: "4",
    name: "Levi's 501 Original Fit Jeans",
    brand: "Levi's",
    category: "Apparel",
    price: 98.0,
    status: "In Stock",
  },
  {
    id: "5",
    name: "H&M Slim Fit Shirt",
    brand: "H&M",
    category: "Apparel",
    price: 29.99,
    status: "In Stock",
  },
  {
    id: "6",
    name: "Zara Oversized Blazer",
    brand: "Zara",
    category: "Apparel",
    price: 89.9,
    status: "Low Stock",
  },
  {
    id: "7",
    name: "Ray-Ban Wayfarer Sunglasses",
    brand: "Ray-Ban",
    category: "Accessories",
    price: 154.0,
    status: "In Stock",
  },
  {
    id: "8",
    name: "Casio G-Shock Watch",
    brand: "Casio",
    category: "Accessories",
    price: 99.0,
    status: "In Stock",
  },
];
