package com.example.aztustaj.controller;

import com.example.aztustaj.entity.Book;
import com.example.aztustaj.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @Value("${app.upload.images-path}")
    private String imagesPath;

    // Tüm kitabları al (axtarış, filtre, sıralama ilə)
    @GetMapping
    public ResponseEntity<?> getBooks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String sort
    ) {
        try {
            List<Book> books = bookService.getAllBooks(search, category, sort);
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Kitabları gətirərkən xəta: " + e.getMessage()));
        }
    }

    // Tüm kitabları al (basit)
    @GetMapping("/all")
    public ResponseEntity<?> getAllBooks() {
        try {
            List<Book> books = bookService.getAllBooks();
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Kitabları gətirərkən xəta: " + e.getMessage()));
        }
    }

    // Şəkil yüklə (File System)
    @PostMapping("/{id}/upload-image")
    public ResponseEntity<?> uploadImage(@PathVariable String id, @RequestParam("file") MultipartFile file) {
        try {
            Book book = bookService.getBookById(id);
            if (book == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Kitab tapılmadı. Göndərilən id: " + id));
            }

            if (file == null || file.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Şəkil faylı boşdur"));
            }

            String fileName = "book-" + id + ".jpg";
            Path uploadPath = Paths.get(imagesPath)
                    .toAbsolutePath()
                    .normalize();

            Files.createDirectories(uploadPath);

            Path filePath = uploadPath.resolve(fileName);
            Files.write(filePath, file.getBytes());

            String imageUrl = "/images/" + fileName;

            book.setImageUrl(imageUrl);
            Book savedBook = bookService.saveBook(book);

            return ResponseEntity.ok(Map.of(
                    "message", "Şəkil yükləndi",
                    "bookId", savedBook.getId(),
                    "imageUrl", savedBook.getImageUrl()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Şəkil yüklənərkən xəta: " + e.getMessage()));
        }
    }

    // ID ilə kitab al
    @GetMapping("/{id}")
    public ResponseEntity<?> getBookById(@PathVariable String id) {
        try {
            Book book = bookService.getBookById(id);
            if (book != null) {
                return ResponseEntity.ok(book);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Kitab tapılmadı"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Kitab gətirərkən xəta: " + e.getMessage()));
        }
    }

    // Yeni kitab əlavə et
    @PostMapping
    public ResponseEntity<?> createBook(@RequestBody Book book) {
        try {
            // Validasiya
            if (book.getTitle() == null || book.getTitle().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Kitab adı boş ola bilməz"));
            }
            if (book.getAuthor() == null || book.getAuthor().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Müəllif adı boş ola bilməz"));
            }
            if (book.getCategory() == null || book.getCategory().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Kateqoriya boş ola bilməz"));
            }
            if (book.getPrice() == null || book.getPrice().signum() < 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Qiymət mənfi və ya boş ola bilməz"));
            }
            if (book.getStockQuantity() < 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Stok sayı mənfi ola bilməz"));
            }

            Book savedBook = bookService.saveBook(book);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedBook);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Kitab əlavə edilərkən xəta: " + e.getMessage()));
        }
    }

    // Kitabı yenilə
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBook(@PathVariable String id, @RequestBody Book book) {
        try {
            Book updatedBook = bookService.updateBook(id, book);
            if (updatedBook != null) {
                return ResponseEntity.ok(updatedBook);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Kitab tapılmadı"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Kitab yenilənərkən xəta: " + e.getMessage()));
        }
    }

    // Kitabı sil
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBook(@PathVariable String id) {
        try {
            Book book = bookService.getBookById(id);
            if (book != null) {
                bookService.deleteBook(id);
                return ResponseEntity.ok(Map.of("message", "Kitab silindi"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Kitab tapılmadı"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Kitab silinərkən xəta: " + e.getMessage()));
        }
    }

    // Health check
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "OK", "message", "Backend aktiv"));
    }
}