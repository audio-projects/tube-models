import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UTracerSetupComponent } from './utracer-setup.component';

describe('UTracerSetupComponent', () => {

    let component: UTracerSetupComponent;
    let fixture: ComponentFixture<UTracerSetupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UTracerSetupComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(UTracerSetupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
