import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductImageGallery } from './product-image-gallery.component';

describe('ProductImageGallery', () => {
  let component: ProductImageGallery;
  let fixture: ComponentFixture<ProductImageGallery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductImageGallery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductImageGallery);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
