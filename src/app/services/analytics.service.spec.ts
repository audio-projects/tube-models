import { TestBed } from '@angular/core/testing';
import { Analytics } from '@angular/fire/analytics';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
    let service: AnalyticsService;
    let mockAnalytics: jasmine.SpyObj<Analytics>;

    beforeEach(() => {
        // Create a mock Analytics object
        mockAnalytics = jasmine.createSpyObj('Analytics', ['app']);

        TestBed.configureTestingModule({
            providers: [
                AnalyticsService,
                { provide: Analytics, useValue: mockAnalytics }
            ]
        });
        service = TestBed.inject(AnalyticsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should log to console in development mode', () => {
        spyOn(console, 'log');
        service.logEvent('test_event', { test_param: 'value' });
        // In development mode (environment.production = false), should log to console
        expect(console.log).toHaveBeenCalledWith('[Analytics - Dev Mode]', 'test_event', { test_param: 'value' });
    });

    it('should log custom events', () => {
        spyOn(console, 'error');
        service.logEvent('test_event', { test_param: 'value' });
        // Event should be logged without errors
        expect(console.error).not.toHaveBeenCalled();
    });

    it('should log tube view events', () => {
        spyOn(service, 'logEvent');
        service.logTubeView('tube123', 'ECC83');
        expect(service.logEvent).toHaveBeenCalledWith('tube_view', {
            tube_id: 'tube123',
            tube_name: 'ECC83'
        });
    });

    it('should log tube upload events', () => {
        spyOn(service, 'logEvent');
        service.logTubeUpload('.utd', 'triode');
        expect(service.logEvent).toHaveBeenCalledWith('tube_upload', {
            file_type: '.utd',
            tube_type: 'triode'
        });
    });

    it('should log parameter calculation events', () => {
        spyOn(service, 'logEvent');
        service.logParameterCalculation('norman-koren-triode', 'triode');
        expect(service.logEvent).toHaveBeenCalledWith('parameter_calculation', {
            model_type: 'norman-koren-triode',
            tube_type: 'triode'
        });
    });

    it('should log plot generation events', () => {
        spyOn(service, 'logEvent');
        service.logPlotGeneration('characteristic_curve', 'pentode');
        expect(service.logEvent).toHaveBeenCalledWith('plot_generation', {
            plot_type: 'characteristic_curve',
            tube_type: 'pentode'
        });
    });

    it('should log tube save events', () => {
        spyOn(service, 'logEvent');
        service.logTubeSave('tube123', true);
        expect(service.logEvent).toHaveBeenCalledWith('tube_save', {
            tube_id: 'tube123',
            is_update: true
        });
    });

    it('should log tube share events', () => {
        spyOn(service, 'logEvent');
        service.logTubeShare('tube123');
        expect(service.logEvent).toHaveBeenCalledWith('tube_share', {
            tube_id: 'tube123'
        });
    });

    it('should log tube search events', () => {
        spyOn(service, 'logEvent');
        service.logTubeSearch('ECC83', 5);
        expect(service.logEvent).toHaveBeenCalledWith('tube_search', {
            search_term: 'ECC83',
            results_count: 5
        });
    });

    it('should log optimization events', () => {
        spyOn(service, 'logEvent');
        service.logOptimization('powell', true, 100);
        expect(service.logEvent).toHaveBeenCalledWith('optimization_complete', {
            algorithm_type: 'powell',
            convergence: true,
            iterations: 100
        });
    });

    it('should log login events', () => {
        spyOn(service, 'logEvent');
        service.logLogin('google');
        expect(service.logEvent).toHaveBeenCalledWith('login', {
            method: 'google'
        });
    });

    it('should log sign up events', () => {
        spyOn(service, 'logEvent');
        service.logSignUp('google');
        expect(service.logEvent).toHaveBeenCalledWith('sign_up', {
            method: 'google'
        });
    });

    it('should handle errors when logging events', () => {
        spyOn(console, 'error');
        // The actual logEvent will be called but won't throw
        service.logEvent('test_event');
        // Should not throw errors
        expect(console.error).not.toHaveBeenCalled();
    });

    it('should set user ID', () => {
        spyOn(console, 'error');
        service.setUserId('user123');
        // Should not throw errors
        expect(console.error).not.toHaveBeenCalled();
    });

    it('should handle null user ID', () => {
        spyOn(console, 'error');
        service.setUserId(null);
        // Should not throw errors
        expect(console.error).not.toHaveBeenCalled();
    });

    it('should set user properties', () => {
        spyOn(console, 'error');
        service.setUserProperties({ userType: 'premium' });
        // Should not throw errors
        expect(console.error).not.toHaveBeenCalled();
    });
});
