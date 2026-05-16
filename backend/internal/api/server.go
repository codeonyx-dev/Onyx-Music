package api

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"music-player-backend/internal/auth"
	"music-player-backend/internal/config"
)

func Run() {
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{"error": err.Error()})
		},
	})

	app.Use(logger.New(logger.Config{
		Format: "${time} | ${status} | ${latency} | ${method} ${path}\n",
	}))

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept, Range, Authorization",
	}))

	app.Post("/api/auth/login", auth.HandleLogin)
	app.Get("/api/settings", HandleSettings)
	app.Get("/health", HandleHealth)

	api := app.Group("/api", auth.Middleware)
	api.Get("/auth/me", auth.HandleMe)
	api.Get("/songs", HandleGetSongs)
	api.Get("/library", HandleGetLibrary)
	api.Get("/library/status", HandleLibraryStatus)
	api.Post("/library/rescan", HandleLibraryRescan)
	api.Get("/stream/*", HandleStream)
	api.Get("/cover/*", HandleCover)

	log.Printf("Onyx API en http://0.0.0.0:%s", config.C.Port)
	log.Printf("Directorio de música: %s", config.C.MusicDir)
	log.Fatal(app.Listen(":" + config.C.Port))
}
