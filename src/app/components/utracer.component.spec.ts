import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UTracerComponent } from './utracer.component';
import { SerialService } from '../services/serial.service';

describe('UTracerComponent', () => {
    let component: UTracerComponent;
    let fixture: ComponentFixture<UTracerComponent>;
    let mockSerialService: jasmine.SpyObj<SerialService>;

    beforeEach(async () => {
        mockSerialService = jasmine.createSpyObj('SerialService', ['isConnected', 'disconnect']);

        await TestBed.configureTestingModule({
            imports: [UTracerComponent],
            providers: [
                { provide: SerialService, useValue: mockSerialService }
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
