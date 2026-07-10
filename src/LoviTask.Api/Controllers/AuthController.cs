using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace LoviTask.Api.Controllers;

/// <summary>
/// Controlador responsável pela autenticação de usuários e emissão de tokens JWT.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;

    // Lista estática de usuários cadastrados e suas senhas para validação
    private static readonly Dictionary<string, string> ValidUsers = new(StringComparer.OrdinalIgnoreCase)
    {
        { "isabelle@lovitask.com", "123456" },
        { "admin@lovitask.com", "admin123" },
        { "convidado@lovitask.com", "convidado123" }
    };

    public AuthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    /// <summary>
    /// Realiza a autenticação e retorna um token JWT válido.
    /// </summary>
    /// <param name="request">Credenciais de e-mail e senha.</param>
    /// <returns>Token JWT e dados do usuário.</returns>
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "E-mail e senha são obrigatórios." });
        }

        // Verifica se o e-mail existe no cadastro fictício e se a senha está correta
        if (!ValidUsers.TryGetValue(request.Email, out var validPassword) || validPassword != request.Password)
        {
            return Unauthorized(new { message = "E-mail ou senha incorretos." });
        }

        var token = GenerateJwtToken(request.Email);
        var expiresAt = DateTime.UtcNow.AddDays(7);

        return Ok(new
        {
            token,
            email = request.Email,
            expiresAt
        });
    }

    /// <summary>
    /// Realiza a autenticação via Google e retorna um token JWT válido.
    /// </summary>
    /// <param name="request">Dados do e-mail do Google.</param>
    /// <returns>Token JWT e dados do usuário.</returns>
    [HttpPost("google")]
    public IActionResult GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "E-mail do Google é obrigatório." });
        }

        // Em uma integração real com OAuth2, validaríamos o ID Token enviado pelo Google.
        // Como estamos simulando a federação de identidade de forma funcional, confiamos no e-mail recebido do fluxo seguro.
        var token = GenerateJwtToken(request.Email);
        var expiresAt = DateTime.UtcNow.AddDays(7);

        return Ok(new
        {
            token,
            email = request.Email,
            expiresAt
        });
    }

    private string GenerateJwtToken(string email)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var secretKey = _configuration["JWT_SECRET_KEY"] ?? "LoviTaskSuperSecretEncryptionKey1234567890!!";
        var key = Encoding.ASCII.GetBytes(secretKey);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Name, email)
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}

/// <summary>
/// Modelo de requisição de login.
/// </summary>
public class LoginRequest
{
    /// <summary>
    /// E-mail do usuário.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Senha do usuário.
    /// </summary>
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// Modelo de requisição de login via Google.
/// </summary>
public class GoogleLoginRequest
{
    /// <summary>
    /// E-mail retornado do Google.
    /// </summary>
    public string Email { get; set; } = string.Empty;
}
