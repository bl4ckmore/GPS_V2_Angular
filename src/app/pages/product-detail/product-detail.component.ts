import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product, ProductService } from '..//../services/product.service';
import { CartService } from '..//..//services/cart.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  relatedProducts: Product[] = [];
  loading = true;
  error: string | null = null;
  quantity = 1;
  maxQuantity = 10;
  addingToCart = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private auth: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = Number(params['id']);
      if (productId && !isNaN(productId)) {
        this.loadProduct(productId);
      } else {
        this.error = 'Invalid product ID';
        this.loading = false;
      }
    });
  }

  private async loadProduct(id: number): Promise<void> {
    try {
      this.loading = true;
      this.product = await this.productService.getProductById(id);
      this.maxQuantity = Math.min(this.product.stock, 10);
      
      // Load related products
      await this.loadRelatedProducts(this.product.category);
    } catch (error: any) {
      console.error('Error loading product:', error);
      this.error = 'Failed to load product details';
    } finally {
      this.loading = false;
    }
  }

  private async loadRelatedProducts(category: string): Promise<void> {
    try {
      const response = await this.productService.getProducts({ category, limit: 4 });
      this.relatedProducts = response.products.filter(p => p.id !== this.product?.id);
    } catch (error: any) {
      console.error('Error loading related products:', error);
      // Don't show error to user for related products
    }
  }

  async addToCart(): Promise<void> {
    if (!this.product) return;

    this.addingToCart = true;
    try {
      await this.cartService.addToCart(this.product.id, this.quantity);
      
      this.snackBar.open(`${this.product.name} added to cart`, 'View Cart', {
        duration: 3000,
        panelClass: ['success-snackbar']
      }).onAction().subscribe(() => {
        this.router.navigate(['/cart']);
      });

    } catch (error: any) {
      console.error('Error adding to cart:', error);
      this.snackBar.open('Failed to add item to cart', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.addingToCart = false;
    }
  }

  incrementQuantity(): void {
    if (this.quantity < this.maxQuantity) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  getStarArray(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  formatPrice(price: number): string {
    return this.productService.formatPrice(price);
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}