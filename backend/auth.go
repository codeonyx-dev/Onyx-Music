package main

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type claims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func authConfig() (user, pass, secret string) {
	return cfg.OnyxUser, cfg.OnyxPassword, cfg.JWTSecret
}

func handleLogin(c *fiber.Ctx) error {
	var body loginRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "JSON inválido"})
	}

	user, pass, secret := authConfig()
	if body.Username != user || body.Password != pass {
		return c.Status(401).JSON(fiber.Map{"error": "Usuario o contraseña incorrectos"})
	}

	token, err := signToken(body.Username, secret)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "No se pudo crear la sesión"})
	}

	return c.JSON(fiber.Map{
		"token":      token,
		"username":   body.Username,
		"expires_in": 86400,
	})
}

func handleMe(c *fiber.Ctx) error {
	username, ok := c.Locals("username").(string)
	if !ok || username == "" {
		return c.Status(401).JSON(fiber.Map{"error": "No autenticado"})
	}
	return c.JSON(fiber.Map{"username": username})
}

func signToken(username, secret string) (string, error) {
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims{
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	})
	return t.SignedString([]byte(secret))
}

func authMiddleware(c *fiber.Ctx) error {
	path := c.Path()
	if strings.HasPrefix(path, "/api/auth/") || path == "/health" {
		return c.Next()
	}

	auth := c.Get("Authorization")
	tokenStr := ""
	if strings.HasPrefix(auth, "Bearer ") {
		tokenStr = strings.TrimPrefix(auth, "Bearer ")
	} else if q := c.Query("token"); q != "" {
		tokenStr = q
	}

	if tokenStr == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Token requerido"})
	}
	_, _, secret := authConfig()

	token, err := jwt.ParseWithClaims(tokenStr, &claims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return c.Status(401).JSON(fiber.Map{"error": "Sesión inválida o expirada"})
	}

	cl, ok := token.Claims.(*claims)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "Sesión inválida"})
	}

	c.Locals("username", cl.Username)
	return c.Next()
}
