import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShipmentDto {
  @ApiProperty({ description: 'Carrier name' })
  carrier: string;

  @ApiProperty({ description: 'Tracking number' })
  number: string;

  @ApiProperty({ description: 'Tracking URL' })
  url: string;

  @ApiProperty({ description: 'Shipped at timestamp' })
  shipped_at: string;
}

export class OrderLineItemDto {
  @ApiProperty({ description: 'Product ID' })
  product_id: string;

  @ApiProperty({ description: 'Variant ID' })
  variant_id: number;

  @ApiProperty({ description: 'Quantity' })
  quantity: number;

  @ApiProperty({ description: 'Product title' })
  product_title: string;

  @ApiProperty({ description: 'Variant label' })
  variant_label: string;

  @ApiPropertyOptional({ description: 'SKU' })
  sku?: string;

  @ApiProperty({ description: 'Status of the line item' })
  status: string;
}

export class OrderResponseDto {
  @ApiProperty({ description: 'Printify order ID' })
  id: string;

  @ApiPropertyOptional({ description: 'External order ID' })
  external_id?: string;

  @ApiProperty({ description: 'Order status' })
  status: string;

  @ApiProperty({ description: 'Total price in cents' })
  total_price: number;

  @ApiProperty({ description: 'Total shipping cost in cents' })
  total_shipping: number;

  @ApiProperty({ description: 'Total tax in cents' })
  total_tax: number;

  @ApiProperty({ description: 'Line items', type: [OrderLineItemDto] })
  line_items: OrderLineItemDto[];

  @ApiPropertyOptional({
    description: 'Shipment information',
    type: [ShipmentDto],
  })
  shipments?: ShipmentDto[];

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: string;

  @ApiPropertyOptional({ description: 'Sent to production timestamp' })
  sent_to_production_at?: string;

  @ApiPropertyOptional({ description: 'Fulfillment timestamp' })
  fulfilled_at?: string;
}

export class OrderStatusDto {
  @ApiProperty({ description: 'Order ID' })
  order_id: string;

  @ApiProperty({ description: 'Current status' })
  status: string;

  @ApiPropertyOptional({ description: 'Status description' })
  status_description?: string;

  @ApiProperty({ description: 'Last updated timestamp' })
  updated_at: string;

  @ApiPropertyOptional({
    description: 'Tracking information',
    type: [ShipmentDto],
  })
  tracking?: ShipmentDto[];
}















