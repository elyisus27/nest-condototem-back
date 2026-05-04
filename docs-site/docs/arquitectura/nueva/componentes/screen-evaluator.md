# Screen Evaluator

Analiza XML de UI.

## Fuente

adb shell uiautomator dump

## Ejemplo de reglas

VISIT_LIST_VISIBLE:
    existe nodo con texto "Visitas"

VISIT_LIST_LOADED:
    count(items) > 0

LOADING:
    existe progress bar

## Regla

Nunca usar tiempo como fuente de verdad.
