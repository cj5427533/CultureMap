package com.culturemap.service;

import com.culturemap.domain.Member;
import com.culturemap.domain.Plan;
import com.culturemap.domain.PlanPost;
import com.culturemap.dto.PlanPostRequest;
import com.culturemap.dto.PlanPostResponse;
import com.culturemap.dto.PlanResponse;
import com.culturemap.dto.PlaceResponse;
import com.culturemap.repository.MemberRepository;
import com.culturemap.repository.PlanPostRepository;
import com.culturemap.repository.PlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PlanPostService {

    private final PlanPostRepository planPostRepository;
    private final PlanRepository planRepository;
    private final MemberRepository memberRepository;

    public PlanPostResponse createPost(PlanPostRequest request, Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        Plan plan = planRepository.findByIdWithDetails(request.getPlanId())
                .orElseThrow(() -> new IllegalArgumentException("플랜을 찾을 수 없습니다"));

        if (!plan.getMember().getId().equals(member.getId())) {
            throw new IllegalArgumentException("권한이 없습니다");
        }

        PlanPost post = PlanPost.builder()
                .plan(plan)
                .title(request.getTitle())
                .description(request.getDescription())
                .build();

        planPostRepository.save(post);
        return toResponse(post);
    }

    @Transactional(readOnly = true)
    public List<PlanPostResponse> getAllPosts() {
        return planPostRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlanPostResponse getPost(Long id) {
        PlanPost post = planPostRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다"));

        return toResponse(post);
    }

    public PlanPostResponse updatePost(Long id, PlanPostRequest request, Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        PlanPost post = planPostRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다"));

        // 작성자 또는 어드민만 수정 가능
        boolean isAuthor = post.getPlan().getMember().getId().equals(member.getId());
        boolean isAdmin = member.getRole() != null && member.getRole().equals("ADMIN");
        
        if (!isAuthor && !isAdmin) {
            throw new IllegalArgumentException("권한이 없습니다");
        }

        post = PlanPost.builder()
                .id(post.getId())
                .plan(post.getPlan())
                .title(request.getTitle())
                .description(request.getDescription())
                .createdAt(post.getCreatedAt())
                .build();

        planPostRepository.save(post);
        return toResponse(post);
    }

    public void deletePost(Long id, Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        PlanPost post = planPostRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다"));

        // 작성자 또는 어드민만 삭제 가능
        boolean isAuthor = post.getPlan().getMember().getId().equals(member.getId());
        boolean isAdmin = member.getRole() != null && member.getRole().equals("ADMIN");
        
        if (!isAuthor && !isAdmin) {
            throw new IllegalArgumentException("권한이 없습니다");
        }

        planPostRepository.delete(post);
    }

    private PlanPostResponse toResponse(PlanPost post) {
        Plan plan = post.getPlan();
        List<PlaceResponse> places = plan.getPlanPlaces().stream()
                .sorted((a, b) -> Integer.compare(a.getVisitOrder(), b.getVisitOrder()))
                .map(pp -> PlaceResponse.builder()
                        .id(pp.getPlace().getId())
                        .name(pp.getPlace().getName())
                        .address(pp.getPlace().getAddress())
                        .category(pp.getPlace().getCategory())
                        .latitude(pp.getPlace().getLatitude())
                        .longitude(pp.getPlace().getLongitude())
                        .description(pp.getPlace().getDescription())
                        .visitOrder(pp.getVisitOrder())
                        .build())
                .collect(Collectors.toList());

        PlanResponse planResponse = PlanResponse.builder()
                .id(plan.getId())
                .planDate(plan.getPlanDate())
                .title(plan.getTitle())
                .memberNickname(plan.getMember().getNickname())
                .places(places)
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .build();

        return PlanPostResponse.builder()
                .id(post.getId())
                .planId(plan.getId())
                .title(post.getTitle())
                .description(post.getDescription())
                .authorNickname(plan.getMember().getNickname())
                .averageRating(post.getAverageRating())
                .ratingCount(post.getRatingCount())
                .plan(planResponse)
                .createdAt(post.getCreatedAt())
                .build();
    }
}

