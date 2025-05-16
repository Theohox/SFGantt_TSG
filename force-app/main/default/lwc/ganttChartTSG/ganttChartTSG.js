import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

import getObjects from '@salesforce/apex/GanttChartController.getObjects';
import getObjectFields from '@salesforce/apex/GanttChartController.getObjectFields';
import getRecords from '@salesforce/apex/GanttChartController.getRecords';

export default class GanttChart extends NavigationMixin(LightningElement) {
    @api recordId;
    @api objectApiName;
    @api height = '500px';
    @api showFilters = true;
    @api showControls = true;
    @api defaultZoom = 'month';
    @api parentField;
    
    @track selectedObject;
    @track dateFields = [];
    @track textFields = [];
    @track startDateField;
    @track endDateField;
    @track labelField;
    @track isLoading = false;
    @track error;
    @track tasks = [];
    @track zoom = 'month';
    @track timeSlots = [];
    
    objectOptions = [];
    zoomOptions = [
        { label: 'Day', value: 'day' },
        { label: 'Week', value: 'week' },
        { label: 'Month', value: 'month' }
    ];
    
    connectedCallback() {
        this.zoom = this.defaultZoom;
        this.loadObjects();
        
        // If parent field is specified, pre-select object and load fields
        if (this.parentField) {
            this.selectedObject = this.objectApiName;
            this.loadFields();
        }
    }
    
    loadObjects() {
        this.isLoading = true;
        getObjects()
            .then(result => {
                this.objectOptions = result.map(obj => ({
                    label: obj.label,
                    value: obj.apiName
                }));
                this.isLoading = false;
            })
            .catch(error => {
                this.handleError(error);
            });
    }
    
    handleObjectChange(event) {
        this.selectedObject = event.detail.value;
        this.loadFields();
    }
    
    loadFields() {
        if (!this.selectedObject) return;
        
        this.isLoading = true;
        getObjectFields({ objectApiName: this.selectedObject })
            .then(result => {
                // Filter date fields
                this.dateFields = result
                    .filter(field => 
                        field.dataType === 'DATE' || 
                        field.dataType === 'DATETIME'
                    )
                    .map(field => ({
                        label: field.label,
                        value: field.apiName
                    }));
                
                // Filter text fields
                this.textFields = result
                    .filter(field => 
                        field.dataType === 'STRING' || 
                        field.dataType === 'TEXT' ||
                        field.dataType === 'PICKLIST' ||
                        field.dataType === 'REFERENCE'
                    )
                    .map(field => ({
                        label: field.label,
                        value: field.apiName
                    }));
                
                this.isLoading = false;
            })
            .catch(error => {
                this.handleError(error);
            });
    }
    
    handleStartFieldChange(event) {
        this.startDateField = event.detail.value;
        this.loadRecords();
    }
    
    handleEndFieldChange(event) {
        this.endDateField = event.detail.value;
        this.loadRecords();
    }
    
    handleLabelFieldChange(event) {
        this.labelField = event.detail.value;
        this.loadRecords();
    }
    
    loadRecords() {
        if (!this.canLoadRecords) return;
        
        this.isLoading = true;
        getRecords({
            objectApiName: this.selectedObject,
            startDateField: this.startDateField,
            endDateField: this.endDateField,
            labelField: this.labelField,
            parentField: this.parentField
        })
            .then(result => {
                this.tasks = this.processTasks(result);
                this.generateTimeSlots();
                this.isLoading = false;
            })
            .catch(error => {
                this.handleError(error);
            });
    }
    
    get canLoadRecords() {
        return this.selectedObject && this.startDateField && 
               this.endDateField && this.labelField;
    }
    
    processTasks(records) {
        return records.map(record => ({
            id: record.Id,
            label: record[this.labelField],
            start: record[this.startDateField],
            end: record[this.endDateField],
            style: this.calculateTaskStyle(record)
        }));
    }
    
    calculateTaskStyle(record) {
        const start = new Date(record[this.startDateField]);
        const end = new Date(record[this.endDateField]);
        // Calculate position and width based on dates
        return `left: 20%; width: 60%;`; // Example values
    }
    
    generateTimeSlots() {
        // Generate time slots based on zoom level
        this.timeSlots = []; // Implementation needed
    }
    
    handleZoomChange(event) {
        this.zoom = event.detail.value;
        this.generateTimeSlots();
    }
    
    handlePrevious() {
        // Handle previous time period
    }
    
    handleNext() {
        // Handle next time period
    }
    
    handleToday() {
        // Reset to today's view
    }
    
    handleTaskClick(event) {
        const recordId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: this.selectedObject,
                actionName: 'view'
            }
        });
    }
    
    handleError(error) {
        this.error = error.body?.message || error.message || 'Unknown error';
        this.isLoading = false;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: this.error,
                variant: 'error'
            })
        );
    }
    
    get containerStyle() {
        return `height: ${this.height};`;
    }
    
    get hasObjectSelected() {
        return !!this.selectedObject;
    }
}