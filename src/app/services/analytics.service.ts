import { Injectable, inject } from '@angular/core';
import { Analytics, logEvent, setUserId, setUserProperties } from '@angular/fire/analytics';
import { environment } from '../../environments/environment';

/**
 * Service for logging analytics events using Firebase Analytics.
 * Provides methods to track user interactions, custom events, and user properties.
 * Analytics is automatically disabled in development environment.
 */
@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {
    private analytics: Analytics = inject(Analytics);
    private isProduction = environment.production;

    /**
     * Log a custom event to Firebase Analytics
     * @param eventName The name of the event
     * @param eventParams Optional parameters to include with the event
     */
    logEvent(eventName: string, eventParams?: Record<string, unknown>): void {
        if (!this.isProduction) {
            console.log('[Analytics - Dev Mode]', eventName, eventParams);
            return;
        }

        try {
            logEvent(this.analytics, eventName, eventParams);
        }
        catch (error) {
            console.error('Error logging analytics event:', error);
        }
    }

    /**
     * Log when a user views a tube
     * @param tubeId The ID of the tube being viewed
     * @param tubeName The name of the tube
     */
    logTubeView(tubeId: string, tubeName?: string): void {
        this.logEvent('tube_view', {
            tube_id: tubeId,
            tube_name: tubeName
        });
    }

    /**
     * Log when a user uploads tube data
     * @param fileType The type of file uploaded (.utd, etc.)
     * @param tubeType The type of tube (triode, pentode, tetrode)
     */
    logTubeUpload(fileType: string, tubeType?: string): void {
        this.logEvent('tube_upload', {
            file_type: fileType,
            tube_type: tubeType
        });
    }

    /**
     * Log when SPICE parameters are calculated
     * @param modelType The model type (norman-koren-triode, norman-koren-pentode, etc.)
     * @param tubeType The type of tube
     */
    logParameterCalculation(modelType: string, tubeType: string): void {
        this.logEvent('parameter_calculation', {
            model_type: modelType,
            tube_type: tubeType
        });
    }

    /**
     * Log when a plot is generated
     * @param plotType The type of plot (characteristic curve, etc.)
     * @param tubeType The type of tube
     */
    logPlotGeneration(plotType: string, tubeType: string): void {
        this.logEvent('plot_generation', {
            plot_type: plotType,
            tube_type: tubeType
        });
    }

    /**
     * Log when a tube is saved to Firebase
     * @param tubeId The ID of the tube
     * @param isUpdate Whether this is an update or new tube
     */
    logTubeSave(tubeId: string, isUpdate: boolean): void {
        this.logEvent('tube_save', {
            tube_id: tubeId,
            is_update: isUpdate
        });
    }

    /**
     * Log when a user shares a tube
     * @param tubeId The ID of the tube being shared
     */
    logTubeShare(tubeId: string): void {
        this.logEvent('tube_share', {
            tube_id: tubeId
        });
    }

    /**
     * Log search/filter activity in tubes list
     * @param searchTerm The search term used
     * @param resultsCount The number of results returned
     */
    logTubeSearch(searchTerm: string, resultsCount: number): void {
        this.logEvent('tube_search', {
            search_term: searchTerm,
            results_count: resultsCount
        });
    }

    /**
     * Log when optimization algorithm completes
     * @param algorithmType The algorithm used (powell, levenberg-marquardt, etc.)
     * @param convergence Whether the algorithm converged
     * @param iterations Number of iterations
     */
    logOptimization(algorithmType: string, convergence: boolean, iterations?: number): void {
        this.logEvent('optimization_complete', {
            algorithm_type: algorithmType,
            convergence: convergence,
            iterations: iterations
        });
    }

    /**
     * Log user login event
     * @param method The authentication method used (google, etc.)
     */
    logLogin(method: string): void {
        this.logEvent('login', {
            method: method
        });
    }

    /**
     * Log user sign up event
     * @param method The authentication method used (google, etc.)
     */
    logSignUp(method: string): void {
        this.logEvent('sign_up', {
            method: method
        });
    }

    /**
     * Set the user ID for analytics
     * @param userId The user's unique identifier
     */
    setUserId(userId: string | null): void {
        if (!this.isProduction) {
            console.log('[Analytics - Dev Mode] setUserId:', userId);
            return;
        }

        try {
            if (userId) {
                setUserId(this.analytics, userId);
            }
        }
        catch (error) {
            console.error('Error setting user ID:', error);
        }
    }

    /**
     * Set user properties for analytics segmentation
     * @param properties Object containing user properties
     */
    setUserProperties(properties: Record<string, unknown>): void {
        if (!this.isProduction) {
            console.log('[Analytics - Dev Mode] setUserProperties:', properties);
            return;
        }

        try {
            setUserProperties(this.analytics, properties);
        }
        catch (error) {
            console.error('Error setting user properties:', error);
        }
    }
}
