import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UTracerComponent } from './utracer.component';
import { UTracerService } from '../services/utracer.service';

describe('UTracerComponent', () => {
    let component: UTracerComponent;
    let fixture: ComponentFixture<UTracerComponent>;
    let mockUTracerService: jasmine.SpyObj<UTracerService>;

    beforeEach(async () => {
        mockUTracerService = jasmine.createSpyObj('UTracerService', ['isConnected', 'disconnect']);

        await TestBed.configureTestingModule({
            imports: [UTracerComponent],
            providers: [
                { provide: UTracerService, useValue: mockUTracerService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(UTracerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit closed event when close is called', () => {
        spyOn(component.closed, 'emit');
        component.close();
        expect(component.closed.emit).toHaveBeenCalled();
    });

    it('should emit closed event when cancel is called', () => {
        spyOn(component.closed, 'emit');
        component.cancel();
        expect(component.closed.emit).toHaveBeenCalled();
    });
});
