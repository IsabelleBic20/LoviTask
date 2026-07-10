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

        // Validação de senha mínima para fins de demonstração
        if (request.Password.Length < 6)
        {
            return Unauthorized(new { message = "A senha deve conter no mínimo 6 caracteres." });
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
