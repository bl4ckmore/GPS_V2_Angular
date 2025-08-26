import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { CartComponent } from './pages/cart/cart.component';
import { ProductListComponent } from './pages/product-list/product-list.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { Checkout } from './pages/checkout/checkout.component';
import { OrderHistory } from './pages/order-history/order-history.component';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { AuthGuard } from './core/auth/auth.guard';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'products', component: ProductListComponent },
  { path: 'product/:id', component: ProductDetailComponent },
  { path: 'cart', component: CartComponent },
  { path: 'checkout', component: Checkout },
  { path: 'orders', component: OrderHistory },

  { path: 'sign-in', component: SignInComponent },   // <-- move ABOVE wildcard

  {
    path: 'admin',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/admin/admin.module').then(m => m.AdminModule)
  },

  { path: '**', redirectTo: '' }                      // <-- wildcard LAST
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
