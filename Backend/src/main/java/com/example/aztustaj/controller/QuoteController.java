package com.example.aztustaj.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Ədəbi sitatları frontend-ə təqdim edən public endpoint.
 * Frontend statik məlumat saxlamamalı, hər şeyi backend-dən almalıdır.
 */
@RestController
@RequestMapping("/api/quotes")
public class QuoteController {

    private static final List<Map<String, String>> QUOTES = List.of(
            Map.of("text", "\"Kitabsız yaşamaq, kor-karana yaşamaqdır.\"", "author", "— Seneca"),
            Map.of("text", "\"Kitab insanın ən sədaqətli dostudur.\"", "author", "— Cicero"),
            Map.of("text", "\"Oxumaq ağıl üçün idmandır.\"", "author", "— Joseph Addison"),
            Map.of("text", "\"Bir kitab oxumaq min həyat yaşamaqdır.\"", "author", "— George R.R. Martin"),
            Map.of("text", "\"Yaxşı kitab əbədi dostdur.\"", "author", "— Martin Tupper"),
            Map.of("text", "\"Kitab pəncərədir başqa dünyalara.\"", "author", "— Anonim")
    );

    @GetMapping
    public ResponseEntity<List<Map<String, String>>> getAllQuotes() {
        return ResponseEntity.ok(QUOTES);
    }

    @GetMapping("/random")
    public ResponseEntity<Map<String, String>> getRandomQuote() {
        Map<String, String> quote = QUOTES.get(ThreadLocalRandom.current().nextInt(QUOTES.size()));
        return ResponseEntity.ok(quote);
    }
}
