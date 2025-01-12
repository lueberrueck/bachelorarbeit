const fs = require('fs');
const xml2js = require('xml2js');
const jsonata = require('jsonata');

// Funktion zum Lesen und Parsen einer XML-Datei
function readXmlFile(filePath) {
  const stripPrefix = xml2js.processors.stripPrefix;
  const parser = new xml2js.Parser({ 
    explicitArray: false,
    attrkey: 'attr',
    charkey: 'text',
    emptyTag: null,
    tagNameProcessors: [stripPrefix],
    attrNameProcessors: [stripPrefix]
  });

  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        parser.parseString(data, (parseErr, result) => {
          if (parseErr) {
            reject(parseErr);
          } else {
            resolve(result);
          }
        });
      }
    });
  });
}

// Funktion zur Anwendung einer JSONata-Expression
async function applyJsonataExpression(json, expression) {
  const compiledExpression = jsonata(expression);
  return await compiledExpression.evaluate(json);
}

// Hauptfunktion
async function harmonizeXmlToJson(xmlFilePath, jsonataExpression) {
  try {
    // TODO XML Schema validieren um dann passendes Regelwerk anzuwenden
    
    // XML in JSON umwandeln
    const jsonFromXml = await readXmlFile(xmlFilePath);
  
    // JSONata-Expression anwenden
    const harmonizedJson = await applyJsonataExpression(jsonFromXml.MachineFeedback, jsonataExpression);
    
    // Ergebnis ausgeben
    console.log(JSON.stringify(harmonizedJson, null, 2));
    
    return harmonizedJson;
  } catch (error) {
    console.error('Fehler bei der Verarbeitung:', error);
  }
}

// Beispielaufruf
const xmlFilePath = './Strukturen/Maschine2/NewTestFile_1.xml'

const jsonataExpression = `{
  "eventType": "MaschinenUpdate",
  "hubName": "ZentralerDatenHub",
  "deviceId": $exists(MachineCode) ? MachineCode : "BAZ_2263",
  "data": {
    "batchLabel": BatchLabel ? BatchLabel : null,
    "sequenceID": SequenceID ? SequenceID : null,
    "profileType": ProfileType ? ProfileType : null,
    "partIndex": PartIndex ? $number(PartIndex) : null,
    "partDescription": PartDescription ? PartDescription : null,
    "componentPosition": ComponentPosition ? ComponentPosition : null,
    "partLength": PartLength ? $number(PartLength) : null,
    "uniqueIdentifier": UniqueIdentifier ? UniqueIdentifier : null,
    "completionDate": CompletionDate ? $fromMillis(
      $toMillis(CompletionDate, "[D1o]. [MNn] [Y0001] [H01]:[m01]"),
      "[Y0001]-[M01]-[D01]T[H01]:[m01]:00Z"
    ) : null,
    "processDuration": ProcessDuration ? $number(ProcessDuration) : null,
    "errors": Errors ? (
      $map(Errors.Error, function($error) {
        {
          "code": $error.Code ? $error.Code : null,
          "message": $error.Message ? $error.Message : null,
          "timestamp": $error.Timestamp ? $fromMillis(
            $toMillis($error.Timestamp, "[D1o]. [MNn] [Y0001] [H01]:[m01]"),
            "[Y0001]-[M01]-[D01]T[H01]:[m01]:00Z"
          ) : null
        }
      })
    ) : [],
    "status": Status ? (
      Status = "yes" ? "true" : "false"
    ) : "on",
    "averageStepTime": AverageStepTime ? $number(AverageStepTime) : null,
    "totalErrors": TotalErrors ? $number(TotalErrors) : null,
    "totalMaterialUsage": TotalMaterialUsage ? $number(TotalMaterialUsage) : null,
    "actualCycleDuration": ProcessDuration ? $number(ProcessDuration) : null
  }
}
`

harmonizeXmlToJson(xmlFilePath, jsonataExpression);
