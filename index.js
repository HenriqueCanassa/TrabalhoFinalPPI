const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'biblioteca',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 60 * 1000 }
}));

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/views/login.html');
});

app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;
    if (usuario === 'admin' && senha === '1234') {
        req.session.usuario = usuario;
        res.cookie('ultimoAcesso', new Date().toLocaleString('pt-BR'));
        res.redirect('/menu');
    } else {
        res.send('Usuário ou senha inválidos');
    }
});

app.get('/menu', (req, res) => {
    if (!req.session.usuario) return res.redirect('/login');
    const ultimoAcesso = req.cookies.ultimoAcesso || 'Primeiro acesso';
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Menu - Biblioteca</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f0f0f0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 350px; text-align: center; }
                h1 { color: #333; }
                .ultimo-acesso { color: #888; font-size: 14px; margin-bottom: 30px; }
                .btn { display: block; width: 100%; padding: 12px; margin: 10px 0; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-size: 16px; box-sizing: border-box; }
                .btn:hover { background-color: #45a049; }
                .btn-sair { background-color: #e53935; }
                .btn-sair:hover { background-color: #c62828; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📚 Biblioteca</h1>
                <p class="ultimo-acesso">Último acesso: ${ultimoAcesso}</p>
                <a href="/livros" class="btn">📖 Cadastro de Livros</a>
                <a href="/leitores" class="btn">👤 Cadastro de Leitores</a>
                <a href="/logout" class="btn btn-sair">🚪 Sair</a>
            </div>
        </body>
        </html>
    `);
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

const livros = [];

app.get('/livros', (req, res) => {
    if (!req.session.usuario) return res.redirect('/login');
    res.sendFile(__dirname + '/views/livros.html');
});

app.post('/livros', (req, res) => {
    if (!req.session.usuario) return res.redirect('/login');
    
    const { titulo, autor, isbn } = req.body;

    if (!titulo || !autor || !isbn) {
        return res.send('Todos os campos são obrigatórios!');
    }

    livros.push({ titulo, autor, isbn });
    res.redirect('/livros/lista');
});

app.get('/livros/lista', (req, res) => {
    if (!req.session.usuario) return res.redirect('/login');
    
    let itens = livros.map(l => `<li>${l.titulo} - ${l.autor} (ISBN: ${l.isbn})</li>`).join('');
    
    res.send(`
        <h1>Livros Cadastrados</h1>
        <ul>${itens || '<li>Nenhum livro cadastrado</li>'}</ul>
        <a href="/livros">Cadastrar novo livro</a><br>
        <a href="/menu">Voltar ao menu</a>
    `);
});

const leitores = [];

app.get('/leitores', (req, res) => {
    if (!req.session.usuario) return res.redirect('/login');
    
    let opcoes = livros.map(l => 
        `<option value="${l.titulo}">${l.titulo}</option>`
    ).join('');
    
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Cadastro de Leitores</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f0f0f0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 350px; }
                h2 { text-align: center; color: #333; }
                input, select { width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
                button { width: 100%; padding: 10px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
                a { display: block; text-align: center; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>👤 Cadastro de Leitores</h2>
                <form action="/leitores" method="POST">
                    <input type="text" name="nome" placeholder="Nome do leitor" required>
                    <input type="text" name="cpf" placeholder="CPF / Identificação" required>
                    <input type="text" name="telefone" placeholder="Telefone" required>
                    <input type="date" name="dataEmprestimo" required>
                    <input type="date" name="dataDevolucao" required>
                    <select name="livro" required>
                        <option value="">Selecione um livro</option>
                        ${opcoes}
                    </select>
                    <button type="submit">Cadastrar</button>
                </form>
                <a href="/menu">Voltar ao menu</a>
            </div>
        </body>
        </html>
    `);
});

app.post('/leitores', (req, res) => {
    if (!req.session.usuario) return res.redirect('/login');
    
    const { nome, cpf, telefone, dataEmprestimo, dataDevolucao, livro } = req.body;

    if (!nome || !cpf || !telefone || !dataEmprestimo || !dataDevolucao || !livro) {
        return res.send('Todos os campos são obrigatórios!');
    }

    leitores.push({ nome, cpf, telefone, dataEmprestimo, dataDevolucao, livro });
    res.send(`
        <h1>Leitor cadastrado com sucesso!</h1>
        <a href="/leitores">Cadastrar novo leitor</a><br>
        <a href="/menu">Voltar ao menu</a>
    `);
});
app.listen(3000, () => {
    console.log('Servidor na porta 3000');
});