# Execution Engine

Motor central de ejecución.

## Flujo interno

1. Ejecutar acción
2. Esperar estabilización (debounce)
3. Evaluar XML
4. Decidir

## Algoritmo

attempts = 0
start_time = now()

while true:

    execute(action)

    sleep(300ms)

    state = evaluator.evaluate()

    if state[action.validation]:
        return SUCCESS

    if now() - start_time > timeout:
        return TIMEOUT

    if strategy == "retry":
        if attempts >= max_retries:
            return FAILED
        attempts++

    elif strategy == "wait":
        sleep(1000)
        continue

    elif strategy == "fail":
        return FAILED

## Reglas

- Nunca avanzar sin validación
- Nunca retry infinito
- Timeout obligatorio
