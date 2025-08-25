import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Pages (CRUD)
import { ProductsPage } from '../admin/products/products.component';
import { CategoriesPage } from '../admin/categories/categories.component';
import { OrdersPage } from './orders/orders.component';
import { CartsPage } from './carts/carts.component';

const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: 'products', component: ProductsPage },
  { path: 'categories', component: CategoriesPage },
  { path: 'orders', component: OrdersPage },
  { path: 'carts', component: CartsPage },
];

@NgModule({
  declarations: [
    ProductsPage,
    CategoriesPage,
    OrdersPage,
    CartsPage
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminModule {}
