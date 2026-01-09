Edyx Editor

Editor de texto desktop focado em escrita objetiva e performance. O EDYX elimina distrações, nuvem ou IA para entregar uma interface industrial em tons de creme com layout A4 fiel e suporte nativo a margens ABNT.

A stack utiliza React e Tailwind no frontend com um backend em Go dedicado ao processamento e exportação de arquivos PDF e DOCX. Todo o conteúdo e preferências são persistidos localmente.

Execução

Para rodar o editor, instale as dependências e inicie o ambiente com npm install e npm run dev. O servidor de exportação deve ser executado separadamente na pasta /core-go com o comando go run main.go.
