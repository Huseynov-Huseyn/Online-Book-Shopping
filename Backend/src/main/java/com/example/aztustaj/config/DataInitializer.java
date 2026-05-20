package com.example.aztustaj.config;

import com.example.aztustaj.entity.Book;
import com.example.aztustaj.entity.Role;
import com.example.aztustaj.entity.User;
import com.example.aztustaj.repository.BookRepository;
import com.example.aztustaj.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initializeUsers();
        initializeBooks();
    }

    private void initializeUsers() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ROLE_ADMIN)
                    .fullName("Huseyn Huseynov")
                    .email("huseynhuseyn343@gmail.com")
                    .phoneNumber("+994500000000")
                    .address("Baku")
                    .build();

            userRepository.save(admin);
        }

        if (!userRepository.existsByUsername("satici")) {
            User seller = User.builder()
                    .username("satici")
                    .password(passwordEncoder.encode("satici123"))
                    .role(Role.ROLE_SATICI)
                    .fullName("Eli Veliyev")
                    .email("eliveliyev@gmail.com")
                    .phoneNumber("+994505555555")
                    .address("Gandja")
                    .build();

            userRepository.save(seller);
        }
    }

    private void initializeBooks() {
        // Əgər kitablar artıq əlavə olunubsa, boş vaxt itirmə
        if (bookRepository.count() > 0) {
            return;
        }

        // Kitab 1: Çapaev və Kosmodemiansky
        Book book1 = Book.builder()
                .id("book-001")
                .title("Çapaev")
                .author("Dmitri Furmanov")
                .category("Bədii Ədəbiyyat")
                .pages(280)
                .year(1923)
                .price(new BigDecimal("25.99"))
                .stockQuantity(15)
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/a/a7/Chapaev_1923_Cover.jpg")
                .build();

        // Kitab 2: Ana
        Book book2 = Book.builder()
                .id("book-002")
                .title("Ana")
                .author("Maksim Qorki")
                .category("Bədii Ədəbiyyat")
                .pages(320)
                .year(1906)
                .price(new BigDecimal("19.99"))
                .stockQuantity(20)
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/b/b6/Gorky_Mother_book_cover.jpg")
                .build();

        // Kitab 3: 1984
        Book book3 = Book.builder()
                .id("book-003")
                .title("1984")
                .author("George Orwell")
                .category("Fantastika")
                .pages(328)
                .year(1949)
                .price(new BigDecimal("22.99"))
                .stockQuantity(12)
                .imageUrl("https://upload.wikimedia.org/wikipedia/en/c/c6/1984_first_edition_cover.jpg")
                .build();

        // Kitab 4: Kriminal və Cəza
        Book book4 = Book.builder()
                .id("book-004")
                .title("Kriminal və Cəza")
                .author("Fedor Dostoyevski")
                .category("Klasik Bədii")
                .pages(671)
                .year(1866)
                .price(new BigDecimal("29.99"))
                .stockQuantity(8)
                .imageUrl("https://upload.wikimedia.org/wikipedia/en/2/2f/Crime_and_punishment_cover.jpg")
                .build();

        // Kitab 5: Azərbaycan Dili
        Book book5 = Book.builder()
                .id("book-005")
                .title("Azərbaycan Dili")
                .author("Ağamirəsi Asqərov")
                .category("Dərsliklər")
                .pages(245)
                .year(2020)
                .price(new BigDecimal("15.99"))
                .stockQuantity(25)
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/1/1f/Azerbaijani_language_book.jpg")
                .build();

        // Bütün kitabları bazaya əlavə et
        bookRepository.save(book1);
        bookRepository.save(book2);
        bookRepository.save(book3);
        bookRepository.save(book4);
        bookRepository.save(book5);

        System.out.println("✅ 5 kitab uğurla bazaya əlavə olundu!");
    }
}