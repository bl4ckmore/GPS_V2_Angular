import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Product } from '../../models';
import { ProductService } from '../../services/product.service';   // ✅ correct path
import { CartService } from '../../services/cart.service';         // ✅ correct path

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  relatedProducts: Product[] = [];
  quantity = 1;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) this.loadProduct(id);
    });
  }

  private loadProduct(id: string): void {
    this.loading = true;
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.product = product;
        this.loadRelatedProducts(id);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading product:', err);
        this.product = null;
        this.loading = false;
      }
    });
  }

  private loadRelatedProducts(productId: string): void {
    this.productService.getRelatedProducts(productId).subscribe({
      next: products => (this.relatedProducts = products),
      error: err => {
        console.error('Error loading related products:', err);
        this.relatedProducts = [];
      }
    });
  }

  addToCart(): void {
    if (!this.product) return;
    this.cartService.addToCart(this.product.id, this.quantity).subscribe({
      next: () =>
        this.snackBar.open('Added to cart successfully!', 'View Cart', { duration: 3000 }),
      error: () =>
        this.snackBar.open('Failed to add to cart', 'Close', { duration: 3000 })
    });
  }

  buyNow(): void {
    this.addToCart();
    this.router.navigate(['/cart']);
  }

  isOutOfStock(): boolean {
    const stock = this.product?.stockQuantity ?? 0;
    return stock <= 0;
  }

  getStockColor(): 'primary' | 'accent' | 'warn' {
    const stock = this.product?.stockQuantity ?? 0;
    if (stock <= 0) return 'warn';
    if (stock <= 10) return 'accent';
    return 'primary';
  }

  getStockIcon(): string {
    return (this.product?.stockQuantity ?? 0) > 0 ? 'check_circle' : 'remove_circle';
  }

  getStockText(): string {
    const stock = this.product?.stockQuantity ?? 0;
    if (stock <= 0) return 'Out of stock';
    if (stock <= 10) return `Only ${stock} left`;
    return `${stock} in stock`;
  }

  getStockClass(): string {
    const stock = this.product?.stockQuantity ?? 0;
    if (stock <= 0) return 'out-of-stock';
    if (stock <= 10) return 'low-stock';
    return 'in-stock';
  }

  navigateToProduct(productId: string): void {
    this.router.navigate(['/product', productId]);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  }
}
