import express from 'express'
import cookieParser from 'cookie-parser';
import path from 'path'
import { pool } from './db.js';
import { fileURLToPath } from 'url'; //esto es por es6, __dirname no sirve como tal
import dotenv from 'dotenv';

dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 

const app = express()
const port = 3000

app.use(cookieParser());
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'views')))


app.get('/', (req, res) => {
    const username = req.cookies.username;
    if (username) {
        // Redirigir a la página de bienvenida
        res.redirect('/welcome');
    } else {
        res.sendFile(path.join(__dirname, 'views/login.html'));
    }
});

app.post('/login', async(req,res)=>{
    const {usernameLogin, passwordLogin} = req.body
    
    try {
        const {rowCount} = await pool.query(`select * from login where username = $1 and password = $2`, [usernameLogin, passwordLogin])
        if(rowCount > 0){
            res.cookie('username', usernameLogin, {
                maxAge: 1000 * 60,  
                httpOnly: true,               // La cookie no es accesible desde JavaScript en el cliente
                secure: false,                // Cambiar a true en producción (HTTPS)
                sameSite: 'lax'               // Previene el envío de la cookie en solicitudes de origen cruzado
            })
            res.redirect('/welcome')
        } else {
            res.sendFile(path.join(__dirname, './views/error.html'))
        }

    } catch (error) {
        console.error('Error al verificar el usuario:', error);
        res.status(500).send('Error interno del servidor');
    }
})

app.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.redirect('/');
});

app.get('/welcome', (req, res) => {
    if (req.cookies.username) {
        res.sendFile(path.join(__dirname, './views/yes.html'));
    } else {
        res.redirect('/');
    }
});


app.listen(port, ()=>{
    console.log(`servidor en el puerto ${port}`)
})
