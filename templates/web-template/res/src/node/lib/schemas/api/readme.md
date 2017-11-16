# Add Avro Schemas here

Files must have the .avsc extension.

## Example

*fullname.avsc*

````javascript

{
     "type": "record",
     "namespace": "com.example",
     "name": "FullName",
     "fields": [
       { "name": "first", "type": "string" },
       { "name": "last", "type": "string" }
     ]
} 

````


