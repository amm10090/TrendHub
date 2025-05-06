import React from "react";

import { EditProductPage } from "./edit-product-page";

// Server component that gets params from the URL
export default async function Page({ params }: { params: { id: string } }) {
  const { id } = await params;

  return <EditProductPage id={id} />;
}
