package com.example.aztustaj.config;

import com.example.aztustaj.entity.Book;
import com.example.aztustaj.entity.Review;
import com.example.aztustaj.entity.Role;
import com.example.aztustaj.entity.User;
import com.example.aztustaj.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final ReviewRepository reviewRepository;
    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initializeUsers();
        initializeBooks();
        initializeReviews();
    }

    private void initializeUsers() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.Admin)
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
                    .role(Role.Owner)
                    .fullName("Eli Veliyev")
                    .email("eliveliyev@gmail.com")
                    .phoneNumber("+994505555555")
                    .address("Gandja")
                    .build();

            userRepository.save(seller);
        }

        if (!userRepository.existsByUsername("user")) {
            User customer = User.builder()
                    .username("user")
                    .password(passwordEncoder.encode("user123"))
                    .role(Role.User)
                    .fullName("Məmməd Məmmədov")
                    .email("mammad@gmail.com")
                    .phoneNumber("+994707777777")
                    .address("Sumqayit")
                    .build();

            userRepository.save(customer);
        }

        if (!userRepository.existsByUsername("elvin")) {
            User customer2 = User.builder()
                    .username("elvin")
                    .password(passwordEncoder.encode("elvin123"))
                    .role(Role.User)
                    .fullName("Elvin Həsənov")
                    .email("elvin@gmail.com")
                    .phoneNumber("+994551234567")
                    .address("Gəncə")
                    .build();

            userRepository.save(customer2);
        }
    }

    private void initializeBooks() {
        // FK asılılıqlarını təmizləyirik ki, kitabları silə bilək
        reviewRepository.deleteAll();
        cartRepository.deleteAll();
        orderRepository.deleteAll();
        bookRepository.deleteAll();

        List<Book> books = new ArrayList<>();

        // Kitab 1: A Study in Scarlet
        books.add(Book.builder()
                .id("book-001")
                .title("A Study in Scarlet")
                .author("Arthur Conan Doyle")
                .category("Detektiv")
                .pages(180)
                .year(1887)
                .price(new BigDecimal("12.50"))
                .stockQuantity(10)
                .imageUrl("/images/A Study in Scarlet.jpg")
                .build());

        // Kitab 2: Otostopçunun Qalaktika Rəhbəri
        books.add(Book.builder()
                .id("book-002")
                .title("Otostopçunun Qalaktika Rəhbəri")
                .author("Douglas Adams")
                .category("Fantastika")
                .pages(224)
                .year(1979)
                .price(new BigDecimal("15.00"))
                .stockQuantity(15)
                .imageUrl("/images/Otostopcunun galaksi rehberi.jpg")
                .build());

        // Kitab 3: The Hound of the Baskervilles
        books.add(Book.builder()
                .id("book-003")
                .title("The Hound of the Baskervilles")
                .author("Arthur Conan Doyle")
                .category("Detektiv")
                .pages(200)
                .year(1902)
                .price(new BigDecimal("14.20"))
                .stockQuantity(8)
                .imageUrl("/images/The Hound of the Baskervilles.jpg")
                .build());

        // Kitab 4: The Sign of the Four
        books.add(Book.builder()
                .id("book-004")
                .title("The Sign of the Four")
                .author("Arthur Conan Doyle")
                .category("Detektiv")
                .pages(150)
                .year(1890)
                .price(new BigDecimal("11.80"))
                .stockQuantity(12)
                .imageUrl("/images/The Sign of the Four novel.jpg")
                .build());

        // Kitab 5: The Valley of Fear
        books.add(Book.builder()
                .id("book-005")
                .title("The Valley of Fear")
                .author("Arthur Conan Doyle")
                .category("Detektiv")
                .pages(190)
                .year(1915)
                .price(new BigDecimal("13.50"))
                .stockQuantity(5)
                .imageUrl("/images/The Valley of Fear.jpg")
                .build());

        // Bütün kitabları bazaya əlavə et
        bookRepository.saveAll(books);

        System.out.println("✅ 5 yeni kitab uğurla bazaya əlavə olundu!");
    }

    private void initializeReviews() {
        User customer1 = userRepository.findByUsername("user").orElse(null);
        User customer2 = userRepository.findByUsername("elvin").orElse(null);
        User seller = userRepository.findByUsername("satici").orElse(null);

        if (customer1 == null || customer2 == null || seller == null) return;

        List<Book> books = bookRepository.findAll();

        for (Book book : books) {
            // Hər kitaba 3 rəy əlavə edirik
            Review review1 = Review.builder()
                    .user(customer1)
                    .book(book)
                    .rating(5)
                    .comment("Mükəmməl bir əsərdir, hər kəsə tövsiyə edirəm!")
                    .build();

            Review review2 = Review.builder()
                    .user(customer2)
                    .book(book)
                    .rating(4)
                    .comment("Maraqlı süjet xətti var, oxumağa dəyər.")
                    .build();

            Review review3 = Review.builder()
                    .user(seller)
                    .book(book)
                    .rating(3)
                    .comment("Orta səviyyəli bir kitabdır.")
                    .build();

            reviewRepository.save(review1);
            reviewRepository.save(review2);
            reviewRepository.save(review3);

            // Kitabın orta reytinqini də yeniləyirik (5+4+3)/3 = 4.0
            book.setAverageRating(4.0);
            bookRepository.save(book);
        }

        System.out.println("✅ Kitablar üçün nümunə rəylər və reytinqlər əlavə olundu!");
    }
}