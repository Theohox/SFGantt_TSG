public with sharing class GanttChartController {
    
    @AuraEnabled(cacheable=true)
    public static List<ObjectInfo> getObjects() {
        List<ObjectInfo> objects = new List<ObjectInfo>();
        
        Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
        for (String objName : globalDescribe.keySet()) {
            Schema.DescribeSObjectResult objDescribe = globalDescribe.get(objName).getDescribe();
            
            if (objDescribe.isAccessible() && objDescribe.isQueryable()) {
                objects.add(new ObjectInfo(
                    objDescribe.getLabel(),
                    objDescribe.getName()
                ));
            }
        }
        
        objects.sort();
        return objects;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<FieldInfo> getObjectFields(String objectApiName) {
        List<FieldInfo> fields = new List<FieldInfo>();
        
        try {
            Map<String, Schema.SObjectField> fieldMap = Schema.getGlobalDescribe()
                .get(objectApiName)
                .getDescribe()
                .fields
                .getMap();
            
            for (String fieldName : fieldMap.keySet()) {
                Schema.DescribeFieldResult fieldDescribe = fieldMap.get(fieldName).getDescribe();
                
                if (fieldDescribe.isAccessible()) {
                    fields.add(new FieldInfo(
                        fieldDescribe.getLabel(),
                        fieldDescribe.getName(),
                        String.valueOf(fieldDescribe.getType())
                    ));
                }
            }
            
            fields.sort();
            return fields;
        } 
        catch (Exception e) {
            throw new AuraHandledException('Error retrieving fields: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static List<SObject> getRecords(
        String objectApiName,
        String startDateField,
        String endDateField,
        String labelField
    ) {
        try {
            String query = 'SELECT Id, ' + 
                          String.escapeSingleQuotes(startDateField) + ', ' +
                          String.escapeSingleQuotes(endDateField) + ', ' +
                          String.escapeSingleQuotes(labelField) +
                          ' FROM ' + String.escapeSingleQuotes(objectApiName) +
                          ' ORDER BY ' + String.escapeSingleQuotes(startDateField) +
                          ' LIMIT 1000';
            
            return Database.query(query);
        } 
        catch (Exception e) {
            throw new AuraHandledException('Error retrieving records: ' + e.getMessage());
        }
    }
    
    public class ObjectInfo implements Comparable {
        @AuraEnabled public String label;
        @AuraEnabled public String apiName;
        
        public ObjectInfo(String label, String apiName) {
            this.label = label;
            this.apiName = apiName;
        }
        
        public Integer compareTo(Object compareTo) {
            ObjectInfo other = (ObjectInfo)compareTo;
            return this.label.compareTo(other.label);
        }
    }
    
    public class FieldInfo implements Comparable {
        @AuraEnabled public String label;
        @AuraEnabled public String apiName;
        @AuraEnabled public String dataType;
        
        public FieldInfo(String label, String apiName, String dataType) {
            this.label = label;
            this.apiName = apiName;
            this.dataType = dataType;
        }
        
        public Integer compareTo(Object compareTo) {
            FieldInfo other = (FieldInfo)compareTo;
            return this.label.compareTo(other.label);
        }
    }
}