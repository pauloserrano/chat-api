## Geral
- [x]  A porta utilizada pelo seu servidor deve ser a 5000 (isso facilita nossa avaliação 🙂)

- [x]  Versionamento usando Git é obrigatório, crie um **repositório público** no seu perfil do GitHub

- [x]  Faça commits a cada funcionalidade implementada

- [x]  Utilize dotenv
#
## Armazenamento de dados
- [x]  Para persistir os dados (participantes e mensagens), utilize coleções do Mongo com a biblioteca `mongodb`

- [x]  O formato de um **participante** deve ser:

```jsx
{name: 'João', lastStatus: 12313123}
```
        
- [x]  O formato de uma **mensagem** deve ser:
        
```jsx
{from: 'João', to: 'Todos', text: 'oi galera', type: 'message', time: '20:04:37'}
```
#
## POST `/participants`
- [x]  Deve receber (pelo body da request), um parâmetro **name**, contendo o nome do participante a ser cadastrado:
        
```jsx
{ name: "João" }
```
        
- [x]  Validar: (caso algum erro seja encontrado, retornar status 422)
    - [x]  name deve ser strings não vazio

- [x]  As validações deverão ser feitas com a biblioteca `joi`

- [x]  Impeça o cadastro de um nome que já está sendo utilizado (caso exista, retornar **status 409**)

- [x]  Salvar o participante com o MongoDB, no formato:
        
```jsx
{ name: 'xxx', lastStatus: Date.now() }
```
        
> Dica: este `Date.now()` gera um **timestamp**, que é o número de milissegundos passados desde 01/01/1970 00:00:00 até o exato momento. É bem útil pra fazer contas matemáticas com data e será útil nos próximos requisitos (para expulsar usuários inativos do chat)
        
- [x]  Salvar com o MongoDB uma mensagem no formato:
        
```jsx
{from: 'xxx', to: 'Todos', text: 'entra na sala...', type: 'status', time: 'HH:MM:SS'}
```
        
> Para gerar o horário nesse formato, (utilize a biblioteca `dayjs`)
        
- [x]  Por fim, retornar **status 201**. Não é necessário retornar nenhuma mensagem além do status.
#
## GET `/participants`
- [x]  Retornar a lista de todos os participantes
#
## POST `/messages`
- [x]  Deve receber (pelo body da request), os parâmetros `to`, `text` e `type`:
        
```jsx
{
    to: "Maria",
    text: "oi sumida rs",
    type: "private_message"
}
```
        
- [x]  Já o `from` da mensagem, ou seja, o remetente, **não será enviado pelo body**. Será enviado pelo front através de um **header** na requisição, chamado `User`

- [x]  Validar: (caso algum erro seja encontrado, retornar **status 422**)
    - [x]  **to** e **text** devem ser strings não vazias
    - [x]  **type** só pode ser 'message' ou 'private_message'
    - [x]  **from** deve ser um participante existente na lista de participantes

>  As validações deverão ser feitas com a biblioteca `joi`, com exceção da validação de um participante existente na lista de participantes (use as funções do MongoDB para isso)

- [x]  Ao salvar essa mensagem, deve ser acrescentado o atributo **time**, contendo a hora atual no formato HH:MM:SS (utilize a biblioteca `dayjs`)

- [x]  Por fim, retornar **status 201**. Não é necessário retornar nenhuma mensagem além do status
#
## GET `/messages`
- [x]  Retornar as mensagens

- [x]  Essa rota deve aceitar um parâmetro via **query string** (o que vem após a interrogação numa URL), indicando a quantidade de mensagens que gostaria de obter. Esse parâmetro deve se chamar `limit`. Ou seja, o request do front será feito pra URL:
        
```jsx
http://localhost:4000/messages?limit=100
```

- [x]  Caso não seja informado um `limit`, todas as mensagens devem ser retornadas. Caso tenha sido fornecido um `limit`, por exemplo 100, somente as últimas 100 mensagens mais recentes devem ser retornadas

- [x]  Além disso, o back-end só deve entregar as mensagens que aquele usuário poderia ver. Ou seja, deve entregar todas as mensagens públicas, todas as mensagens privadas enviadas para ele e por ele. Para isso, o front envia um header `User` para identificar quem está fazendo a requisição
#
## POST `/status`
- [x]  Deve receber por um **header** na requisição, chamado `User`, contendo o nome do participante a ser atualizado

- [x]  Caso este participante não conste na lista de participantes, deve ser retornado um **status 404.** Nenhuma mensagem precisa ser retornada além do status.

- [x]  Atualizar o atributo **lastStatus** do participante informado para o timestamp atual, utilizando `Date.now()`

- [x]  Por fim, retornar **status 200**

## Remoção automática de usuários inativos
- [x]  A cada 15 segundos, remova da lista de participantes os participantes que possuam um **lastStatus** de mais de 10 segundos atrás
        
> **Dica:** você pode usar `setInterval` no arquivo do seu servidor
        
- [x]  Para cada participante removido, salve uma nova mensagem em memória, no formato:
        
```jsx
{from: 'xxx', to: 'Todos', text: 'sai da sala...', type: 'status', time: 'HH:MM:SS'}
```