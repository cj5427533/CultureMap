package com.culturemap.service;

import com.culturemap.domain.Member;
import com.culturemap.domain.Plan;
import com.culturemap.domain.PlanPlace;
import com.culturemap.domain.Place;
import com.culturemap.dto.AddPlaceToPlanRequest;
import com.culturemap.dto.PlanInviteRequest;
import com.culturemap.dto.PlanRequest;
import com.culturemap.dto.PlanResponse;
import com.culturemap.dto.PlaceResponse;
import com.culturemap.domain.PlanMember;
import com.culturemap.repository.MemberRepository;
import com.culturemap.repository.PlanRepository;
import com.culturemap.repository.PlaceRepository;
import com.culturemap.repository.PlanMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * 플랜 관리 서비스
 * - 플랜 CRUD, 멤버 초대, 권한 관리
 */
@Service
@RequiredArgsConstructor
@Transactional
public class PlanService {

    private final PlanRepository planRepository;
    private final MemberRepository memberRepository;
    private final PlaceRepository placeRepository;
    private final PlanMemberRepository planMemberRepository;

    /**
     * 플랜 생성
     * - 장소를 순서대로 추가하고 방문 시간 설정
     * - visitOrder는 리스트 인덱스 + 1로 자동 설정
     */
    public PlanResponse createPlan(PlanRequest request, Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        Plan plan = Plan.builder()
                .member(member)
                .planDate(request.getPlanDate())
                .title(request.getTitle())
                .build();

        // 장소 추가 (순서대로 visitOrder 설정)
        IntStream.range(0, request.getPlaceIds().size()).forEach(index -> {
            Long placeId = request.getPlaceIds().get(index);
            Place place = placeRepository.findById(placeId)
                    .orElseThrow(() -> new IllegalArgumentException("장소를 찾을 수 없습니다: " + placeId));

            PlanPlace.PlanPlaceBuilder planPlaceBuilder = PlanPlace.builder()
                    .plan(plan)
                    .place(place)
                    .visitOrder(index + 1);

            // visitTime이 있으면 설정
            if (request.getVisitTimes() != null && request.getVisitTimes().containsKey(String.valueOf(placeId))) {
                String timeStr = request.getVisitTimes().get(String.valueOf(placeId));
                if (timeStr != null && !timeStr.isEmpty()) {
                    try {
                        LocalTime visitTime = LocalTime.parse(timeStr);
                        planPlaceBuilder.visitTime(visitTime);
                    } catch (Exception e) {
                        // 시간 파싱 실패 시 무시
                    }
                }
            }

            plan.addPlanPlace(planPlaceBuilder.build());
        });

        planRepository.save(plan);
        return toResponse(plan);
    }

    @Transactional(readOnly = true)
    public List<PlanResponse> getMyPlans(Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        return planRepository.findByMember(member).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlanResponse> getMyPlansByDate(java.time.LocalDate date, Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        return planRepository.findByMemberAndPlanDate(member, date).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * 플랜 조회 (권한 확인)
     * - 소유자 또는 협업 멤버만 조회 가능
     */
    @Transactional(readOnly = true)
    public PlanResponse getPlan(Long id, Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        Plan plan = planRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new IllegalArgumentException("플랜을 찾을 수 없습니다"));

        // 플랜 소유자 또는 협업 멤버인지 확인
        boolean isOwner = plan.getMember().getId().equals(member.getId());
        boolean isCollaborator = planMemberRepository.existsByPlanIdAndMemberId(id, member.getId());

        if (!isOwner && !isCollaborator) {
            throw new IllegalArgumentException("권한이 없습니다");
        }

        return toResponse(plan);
    }

    /**
     * 플랜 수정
     * - 소유자 또는 EDITOR 권한 협업 멤버만 수정 가능
     * - 기존 장소를 모두 제거하고 새로 추가
     */
    public PlanResponse updatePlan(Long id, PlanRequest request, Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        Plan plan = planRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new IllegalArgumentException("플랜을 찾을 수 없습니다"));

        // 플랜 소유자 또는 EDITOR 권한 협업 멤버만 수정 가능
        boolean isOwner = plan.getMember().getId().equals(member.getId());
        boolean isEditor = planMemberRepository.findByPlanIdAndMemberId(id, member.getId())
                .map(pm -> "EDITOR".equals(pm.getRole()))
                .orElse(false);

        if (!isOwner && !isEditor) {
            throw new IllegalArgumentException("권한이 없습니다");
        }

        // Plan 정보 업데이트
        plan.updatePlanDate(request.getPlanDate());
        plan.updateTitle(request.getTitle());

        // 기존 PlanPlace 제거
        plan.getPlanPlaces().clear();

        // 새로운 장소 추가
        IntStream.range(0, request.getPlaceIds().size()).forEach(index -> {
            Long placeId = request.getPlaceIds().get(index);
            Place place = placeRepository.findById(placeId)
                    .orElseThrow(() -> new IllegalArgumentException("장소를 찾을 수 없습니다: " + placeId));

            PlanPlace.PlanPlaceBuilder planPlaceBuilder = PlanPlace.builder()
                    .plan(plan)
                    .place(place)
                    .visitOrder(index + 1);

            // visitTime이 있으면 설정
            if (request.getVisitTimes() != null && request.getVisitTimes().containsKey(String.valueOf(placeId))) {
                String timeStr = request.getVisitTimes().get(String.valueOf(placeId));
                if (timeStr != null && !timeStr.isEmpty()) {
                    try {
                        LocalTime visitTime = LocalTime.parse(timeStr);
                        planPlaceBuilder.visitTime(visitTime);
                    } catch (Exception e) {
                        // 시간 파싱 실패 시 무시
                    }
                }
            }

            plan.addPlanPlace(planPlaceBuilder.build());
        });

        planRepository.save(plan);
        return toResponse(plan);
    }

    public void deletePlan(Long id, Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        Plan plan = planRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new IllegalArgumentException("플랜을 찾을 수 없습니다"));

        if (!plan.getMember().getId().equals(member.getId())) {
            throw new IllegalArgumentException("권한이 없습니다");
        }

        planRepository.delete(plan);
    }

    public PlanResponse addPlaceToPlan(AddPlaceToPlanRequest request, Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        Place place = placeRepository.findById(request.getPlaceId())
                .orElseThrow(() -> new IllegalArgumentException("장소를 찾을 수 없습니다"));

        // 같은 날짜의 플랜 찾기
        List<Plan> existingPlans = planRepository.findByMemberAndPlanDate(member, request.getPlanDate());

        Plan plan;
        if (!existingPlans.isEmpty()) {
            // 첫 번째 플랜 사용 (같은 날짜에 여러 플랜이 있을 경우)
            plan = existingPlans.get(0);
        } else {
            // 새 플랜 생성
            plan = Plan.builder()
                    .member(member)
                    .planDate(request.getPlanDate())
                    .title(request.getTitle() != null ? request.getTitle() : request.getPlanDate().toString())
                    .build();
            planRepository.save(plan);
        }

        // 장소가 이미 플랜에 있는지 확인
        boolean placeExists = plan.getPlanPlaces().stream()
                .anyMatch(pp -> pp.getPlace().getId().equals(place.getId()));

        if (placeExists) {
            throw new IllegalArgumentException("이미 플랜에 추가된 장소입니다");
        }

        // 방문 순서 결정 (기존 장소 수 + 1)
        int nextOrder = plan.getPlanPlaces().size() + 1;

        // 장소 추가
        PlanPlace planPlace = PlanPlace.builder()
                .plan(plan)
                .place(place)
                .visitOrder(nextOrder)
                .visitTime(request.getVisitTime())
                .build();

        plan.addPlanPlace(planPlace);
        planRepository.save(plan);

        return toResponse(plan);
    }

    /**
     * 플랜 멤버 초대
     * - 소유자만 초대 가능
     * - OWNER/EDITOR/VIEWER 권한 설정
     * - 중복 초대 방지
     */
    public void inviteMember(PlanInviteRequest request, Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member inviter = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        Plan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new IllegalArgumentException("플랜을 찾을 수 없습니다"));

        // 플랜 소유자만 초대 가능
        if (!plan.getMember().getId().equals(inviter.getId())) {
            throw new IllegalArgumentException("플랜 소유자만 멤버를 초대할 수 있습니다");
        }

        Member invitee = memberRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("초대할 사용자를 찾을 수 없습니다"));

        // 자기 자신은 초대 불가
        if (invitee.getId().equals(inviter.getId())) {
            throw new IllegalArgumentException("자기 자신은 초대할 수 없습니다");
        }

        // 이미 초대된 멤버인지 확인
        if (planMemberRepository.existsByPlanIdAndMemberId(request.getPlanId(), invitee.getId())) {
            throw new IllegalArgumentException("이미 초대된 멤버입니다");
        }

        PlanMember planMember = PlanMember.builder()
                .plan(plan)
                .member(invitee)
                .role(request.getRole())
                .build();

        planMemberRepository.save(planMember);
    }

    @Transactional(readOnly = true)
    public List<PlanResponse> getSharedPlans(Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        return planMemberRepository.findByMemberId(member.getId()).stream()
                .map(PlanMember::getPlan)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Plan 엔티티를 PlanResponse DTO로 변환
     * - 장소는 방문 시간 우선, 없으면 visitOrder로 정렬
     */
    private PlanResponse toResponse(Plan plan) {
        List<PlaceResponse> places = plan.getPlanPlaces().stream()
                .sorted((a, b) -> {
                    // 시간이 있으면 시간 순으로, 없으면 순서 순으로 정렬
                    if (a.getVisitTime() != null && b.getVisitTime() != null) {
                        return a.getVisitTime().compareTo(b.getVisitTime());
                    } else if (a.getVisitTime() != null) {
                        return -1;
                    } else if (b.getVisitTime() != null) {
                        return 1;
                    }
                    return Integer.compare(a.getVisitOrder(), b.getVisitOrder());
                })
                .map(pp -> PlaceResponse.builder()
                        .id(pp.getPlace().getId())
                        .name(pp.getPlace().getName())
                        .address(pp.getPlace().getAddress())
                        .category(pp.getPlace().getCategory())
                        .latitude(pp.getPlace().getLatitude())
                        .longitude(pp.getPlace().getLongitude())
                        .description(pp.getPlace().getDescription())
                        .visitOrder(pp.getVisitOrder())
                        .visitTime(pp.getVisitTime())
                        .build())
                .collect(Collectors.toList());

        return PlanResponse.builder()
                .id(plan.getId())
                .planDate(plan.getPlanDate())
                .title(plan.getTitle())
                .memberNickname(plan.getMember().getNickname())
                .places(places)
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .build();
    }
}

