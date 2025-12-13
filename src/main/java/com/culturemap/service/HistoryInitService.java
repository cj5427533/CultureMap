package com.culturemap.service;

import com.culturemap.domain.History;
import com.culturemap.domain.Member;
import com.culturemap.repository.HistoryRepository;
import com.culturemap.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HistoryInitService {

    private final MemberRepository memberRepository;
    private final HistoryRepository historyRepository;

    @Transactional
    public void initializeHistoryImages() {
        String adminEmail = "cj5427533@o365.jeiu.ac.kr";
        Member adminMember = memberRepository.findByEmail(adminEmail).orElse(null);
        
        if (adminMember == null) {
            log.info("History 초기화: 관리자 계정을 찾을 수 없습니다.");
            return;
        }
        
        // 관리자 계정에 히스토리 초기화
        initializeHistoryForMember(adminMember);
    }
    
    @Transactional
    public void initializeHistoryForMember(Member member) {
        if (member == null) {
            log.warn("History 초기화: 멤버가 null입니다.");
            return;
        }

        try {
            // history_image 폴더 경로
            Path historyImagePath = Paths.get("history_image");
            File historyImageDir = historyImagePath.toFile();

            if (!historyImageDir.exists() || !historyImageDir.isDirectory()) {
                log.warn("History 초기화: history_image 폴더를 찾을 수 없습니다. 멤버 ID: {}", member.getId());
                return;
            }

            // 기존 history 삭제
            historyRepository.deleteByMemberId(member.getId());
            log.info("History 초기화: 기존 히스토리 삭제 완료. 멤버 ID: {}", member.getId());

            // 파일 목록 가져오기
            File[] files = historyImageDir.listFiles((dir, name) -> 
                name.toLowerCase().endsWith(".jpg") || 
                name.toLowerCase().endsWith(".jpeg") || 
                name.toLowerCase().endsWith(".png")
            );

            if (files == null || files.length == 0) {
                log.warn("History 초기화: 이미지 파일을 찾을 수 없습니다.");
                return;
            }

            // 숫자 순서대로 정렬
            List<File> sortedFiles = Arrays.stream(files)
                    .sorted((f1, f2) -> {
                        int num1 = extractNumber(f1.getName());
                        int num2 = extractNumber(f2.getName());
                        return Integer.compare(num1, num2);
                    })
                    .collect(Collectors.toList());

            // 각 공연마다 임의의 날짜 설정 (2025년 중 다양한 날짜, 최신부터 과거순)
            // 왼쪽(첫 번째 포스터)이 가장 최신 날짜, 오른쪽으로 갈수록 과거 날짜
            LocalDate[] eventDates = {
                LocalDate.of(2025, 12, 18),  // 가장 최신 (첫 번째 포스터)
                LocalDate.of(2025, 11, 15),
                LocalDate.of(2025, 10, 5),
                LocalDate.of(2025, 8, 22),
                LocalDate.of(2025, 6, 30),
                LocalDate.of(2025, 4, 18),
                LocalDate.of(2025, 2, 10)    // 가장 과거 (마지막 포스터)
            };

            String location = "인천동구문화체육센터";

            // History 저장
            int order = 1;
            for (int i = 0; i < sortedFiles.size(); i++) {
                File file = sortedFiles.get(i);
                String imageUrl = "/history_image/" + file.getName();
                
                // 날짜 배열에서 순서대로 선택 (첫 번째 포스터 = 최신 날짜, 마지막 포스터 = 과거 날짜)
                // 배열 범위 초과 시 마지막(가장 과거) 날짜 사용
                LocalDate eventDate = eventDates[Math.min(i, eventDates.length - 1)];
                
                History history = History.builder()
                        .member(member)
                        .imageUrl(imageUrl)
                        .eventDate(eventDate)
                        .location(location)
                        .displayOrder(order++)
                        .build();
                historyRepository.save(history);
                log.info("History 초기화: {} 추가됨 (날짜: {}, 장소: {}, 순서: {})", 
                    imageUrl, eventDate, location, history.getDisplayOrder());
            }

            log.info("History 초기화 완료: {}개의 이미지가 추가되었습니다. 멤버 ID: {}", sortedFiles.size(), member.getId());
        } catch (Exception e) {
            log.error("History 초기화 중 오류 발생. 멤버 ID: {}", member.getId(), e);
            throw e; // 트랜잭션 롤백을 위해 예외 재던지기
        }
    }

    private int extractNumber(String filename) {
        Pattern pattern = Pattern.compile("(\\d+)");
        Matcher matcher = pattern.matcher(filename);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        return Integer.MAX_VALUE; // 숫자가 없으면 마지막으로
    }
}
