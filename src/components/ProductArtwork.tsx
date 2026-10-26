interface ProductArtworkProps {
  name: string;
  category: string;
  className?: string;
  imageClassName?: string;
  showLabel?: boolean;
}

const PRODUCT_IMAGES = {
  headphones: '/images/products/headphones.jpg',
  phone: '/images/products/phone.jpg',
  laptop: '/images/products/laptop.jpg',
  sneaker: '/images/products/sneaker.jpg',
  backpack: '/images/products/backpack.jpg',
  camera: '/images/products/camera.jpg',
  kitchen: '/images/products/kitchen.jpg',
} as const;

function imageForProduct(name: string, category: string): string {
  const value = `${name} ${category}`.toLowerCase();

  if (/headphone|earbud|earphone|speaker/.test(value)) return PRODUCT_IMAGES.headphones;
  if (/laptop|notebook|chromebook/.test(value)) return PRODUCT_IMAGES.laptop;
  if (/mobile|phone|smartphone|iphone/.test(value)) return PRODUCT_IMAGES.phone;
  if (/camera|dslr|mirrorless/.test(value)) return PRODUCT_IMAGES.camera;
  if (/shoe|sneaker|footwear|fashion/.test(value)) return PRODUCT_IMAGES.sneaker;
  if (/bag|backpack|luggage/.test(value)) return PRODUCT_IMAGES.backpack;
  if (/kitchen|kettle|air fryer|induction|appliance/.test(value)) return PRODUCT_IMAGES.kitchen;

  if (/electronic/.test(value)) return PRODUCT_IMAGES.headphones;
  if (/laptop/.test(value)) return PRODUCT_IMAGES.laptop;
  if (/mobil/.test(value)) return PRODUCT_IMAGES.phone;
  if (/fashion/.test(value)) return PRODUCT_IMAGES.sneaker;
  if (/bag/.test(value)) return PRODUCT_IMAGES.backpack;
  if (/home/.test(value)) return PRODUCT_IMAGES.kitchen;

  return PRODUCT_IMAGES.camera;
}

export function ProductArtwork({
  name,
  category,
  className = '',
  imageClassName = '',
  showLabel = true,
}: ProductArtworkProps) {
  return (
    <div className={`product-artwork ${className}`}>
      <img
        src={imageForProduct(name, category)}
        alt={`Illustrative ${category.toLowerCase()} product image`}
        className={imageClassName}
        loading="lazy"
      />
      <div className="product-artwork-shade" aria-hidden="true" />
      {showLabel && <span className="product-artwork-label">Representative image</span>}
    </div>
  );
}
