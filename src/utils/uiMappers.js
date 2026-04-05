export const mapMovementToNotification = (movement) => {
  const movementKind = movement?.type;
  const type = movementKind === 'receipt'
    ? 'stock_in'
    : movementKind === 'issue'
      ? 'stock_out'
      : 'adjustment';

  const title = movementKind === 'receipt'
    ? 'Entrée de stock'
    : movementKind === 'issue'
      ? 'Sortie de stock'
      : 'Ajustement de stock';

  return {
    id: `movement_${movement?.id}`,
    type,
    title,
    description: `${movement?.product?.name || 'Produit'} (${movement?.quantity || 0} unités)`,
    timestamp: movement?.createdAt || new Date().toISOString(),
    metadata: {
      movementId: movement?.id,
      productId: movement?.productId,
      quantity: movement?.quantity
    }
  };
};

export const mapProductToNotification = (product) => {
  const isOutOfStock = Number(product?.quantity || 0) === 0;

  return {
    id: `alert_${product?.id}`,
    type: isOutOfStock ? 'out_of_stock' : 'low_stock',
    title: isOutOfStock ? 'Rupture de stock' : 'Stock faible',
    description: `${product?.name} - ${product?.quantity || 0}/${product?.minStock || 0}`,
    timestamp: product?.updatedAt || product?.createdAt || new Date().toISOString(),
    metadata: {
      productId: product?.id,
      quantity: product?.quantity,
      minStock: product?.minStock
    }
  };
};

export const mapProductToStockAlert = (product) => ({
  id: product?.id,
  productName: product?.name,
  sku: product?.sku,
  currentStock: Number(product?.quantity || 0),
  minStock: Number(product?.minStock || 0),
  location: product?.location || 'N/A'
});

export const mapMovementToActivity = (movement) => {
  const movementKind = movement?.type;

  return {
    id: movement?.id,
    type: movementKind === 'receipt'
      ? 'stock_in'
      : movementKind === 'issue'
        ? 'stock_out'
        : 'adjustment',
    title: movementKind === 'receipt'
      ? 'Entrée de stock'
      : movementKind === 'issue'
        ? 'Sortie de stock'
        : 'Ajustement',
    description: `${movement?.product?.name || 'Produit'} (${movement?.quantity || 0} unités)`,
    user: movement?.user?.fullName || 'Système',
    timestamp: movement?.createdAt || new Date().toISOString()
  };
};

export const mapProductToActivity = (product) => ({
  id: product?.id,
  type: 'product_added',
  title: 'Produit disponible',
  description: `${product?.name} (${product?.sku || 'N/A'})`,
  user: 'Système',
  timestamp: product?.updatedAt || product?.createdAt || new Date().toISOString()
});
