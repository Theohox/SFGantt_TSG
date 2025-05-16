public with sharing class GanttChartController {
    
    @AuraEnabled(cacheable=true)
    public static List<ObjectInfo> getObjects(String contextObjectName, Id recordId) {
        List<ObjectInfo> objects = new List<ObjectInfo>();
        
        Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
        
        Set<String> relatedObjects = new Set<String>();
        if (String.isNotBlank(contextObjectName)) {
            Schema.DescribeSObjectResult contextObj = globalDescribe.get(contextObjectName).getDescribe();
            
            for (Schema.ChildRelationship rel : contextObj.getChildRelationships()) {
                relatedObjects.add(rel.getChildSObject().getDescribe().getName());
            }
            
            for (Schema.SObjectField field : contextObj.fields.getMap().values()) {
                Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
                if (fieldDescribe.getType() == Schema.DisplayType.REFERENCE) {
                    for (Schema.SObjectType ref : fieldDescribe.getReferenceTo()) {
                        relatedObjects.add(ref.getDescribe().getName());
                    }
                }
            }
        }
        
        for (String objName : globalDescribe.keySet()) {
            Schema.DescribeSObjectResult objDescribe = globalDescribe.get(objName).getDescribe();
            
            if (objDescribe.isAccessible() && objDescribe.isQueryable() && 
                (String.isBlank(contextObjectName) || relatedObjects.contains(objName))) {
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
                    if (fieldDescribe.getType() == Schema.DisplayType.DATE) {
                        fields.add(new FieldInfo(
                            fieldDescribe.getLabel(),
                            fieldDescribe.getName(),
                            'Date'
                        ));
                    }
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
        List<String> fields, 
        String startDateField,
        String endDateField,
        Date startDate,
        Date endDate,
        String contextObjectName,
        Id contextRecordId
    ) {
        try {
            Set<String> uniqueFields = new Set<String>(fields);
            uniqueFields.add('Id');
            
            String query = 'SELECT ' + String.join(new List<String>(uniqueFields), ', ') + 
                           ' FROM ' + objectApiName;
            
            List<String> whereConditions = new List<String>();
            
            if (startDate != null && endDate != null) {
                whereConditions.add('(' +
                    startDateField + ' >= :startDate AND ' + 
                    startDateField + ' <= :endDate' + 
                ') OR (' +
                    endDateField + ' >= :startDate AND ' + 
                    endDateField + ' <= :endDate' + 
                ') OR (' +
                    startDateField + ' <= :startDate AND ' + 
                    endDateField + ' >= :endDate' + 
                ')');
            }
            
            if (String.isNotBlank(contextObjectName) && contextRecordId != null) {
                String relationshipField = getRelationshipField(objectApiName, contextObjectName);
                if (String.isNotBlank(relationshipField)) {
                    whereConditions.add(relationshipField + ' = :contextRecordId');
                }
            }
            
            if (!whereConditions.isEmpty()) {
                query += ' WHERE ' + String.join(whereConditions, ' AND ');
            }
            
            query += ' ORDER BY ' + startDateField + ' ASC LIMIT 1000';
            
            return Database.query(query);
        } 
        catch (Exception e) {
            throw new AuraHandledException('Error retrieving records: ' + e.getMessage());
        }
    }
    
    private static String getRelationshipField(String childObject, String parentObject) {
        Schema.DescribeSObjectResult childDescribe = Schema.getGlobalDescribe().get(childObject).getDescribe();
        
        for (Schema.SObjectField field : childDescribe.fields.getMap().values()) {
            Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
            if (fieldDescribe.getType() == Schema.DisplayType.REFERENCE) {
                for (Schema.SObjectType ref : fieldDescribe.getReferenceTo()) {
                    if (ref.getDescribe().getName() == parentObject) {
                        return fieldDescribe.getName();
                    }
                }
            }
        }
        
        return '';
    }
    
    @AuraEnabled
    public static String saveConfiguration(String configStr) {
        try {
            List<Gantt_Chart_Configuration__c> configsToInsert = new List<Gantt_Chart_Configuration__c>();
            
            Gantt_Chart_Configuration__c config = new Gantt_Chart_Configuration__c(
                Name = 'Gantt Configuration',
                Configuration__c = configStr,
                OwnerId = UserInfo.getUserId()
            );
            
            configsToInsert.add(config);
            insert configsToInsert;
            return config.Id;
        } 
        catch (Exception e) {
            throw new AuraHandledException('Error saving configuration: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<ConfigInfo> getConfiguration() {
        try {
            List<ConfigInfo> configs = new List<ConfigInfo>();
            
            List<Gantt_Chart_Configuration__c> savedConfigs = [
                SELECT Id, Name, Configuration__c, CreatedDate
                FROM Gantt_Chart_Configuration__c
                WHERE OwnerId = :UserInfo.getUserId()
                ORDER BY CreatedDate DESC
            ];
            
            for (Gantt_Chart_Configuration__c config : savedConfigs) {
                configs.add(new ConfigInfo(
                    config.Id,
                    config.Name,
                    config.Configuration__c
                ));
            }
            
            return configs;
        } 
        catch (Exception e) {
            throw new AuraHandledException('Error retrieving configurations: ' + e.getMessage());
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
            ObjectInfo otherObj = (ObjectInfo)compareTo;
            return this.label.compareTo(otherObj.label);
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
            FieldInfo otherField = (FieldInfo)compareTo;
            return this.label.compareTo(otherField.label);
        }
    }
    
    public class ConfigInfo {
        @AuraEnabled public String id;
        @AuraEnabled public String label;
        @AuraEnabled public String configData;
        
        public ConfigInfo(String id, String label, String configData) {
            this.id = id;
            this.label = label;
            this.configData = configData;
        }
    }
}