import React from "react";

import { EditProductPage } from "./edit-product-page";

// Server component that gets params from the URL
export default function Page({ params }: { params: { id: string } }) {
  return <EditProductPage id={params.id} />;
}
