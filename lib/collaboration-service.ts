import { getAdminDb } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { CollaborationRequest, CollaborationType } from '@/types/booking';
import { Team } from '@/types/team';

/**
 * 팀간 협업 요청 관리 서비스
 * AIR팀과 CINT팀 간의 협업 요청을 처리합니다
 */
export class CollaborationService {
  private static db = getAdminDb();

  /**
   * 협업 요청을 생성합니다
   * @param requestData 협업 요청 데이터
   * @returns 생성된 협업 요청 ID
   */
  static async createCollaborationRequest(
    requestData: Omit<CollaborationRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const collaborationRequest: Omit<CollaborationRequest, 'id'> = {
        ...requestData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await this.db.collection('collaboration_requests').add(collaborationRequest);

      console.log(`✅ 협업 요청 생성: ${docRef.id} (${requestData.type})`);
      return docRef.id;

    } catch (error) {
      console.error('❌ 협업 요청 생성 실패:', error);
      throw error;
    }
  }

  /**
   * ID로 개별 협업 요청을 조회합니다
   * @param requestId 협업 요청 ID
   * @returns 협업 요청 또는 null
   */
  static async getCollaborationRequestById(requestId: string): Promise<CollaborationRequest | null> {
    try {
      const doc = await this.db.collection('collaboration_requests').doc(requestId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      const data = doc.data();
      if (!data) {
        return null;
      }

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate(),
        respondedBy: data.respondedBy ? {
          ...data.respondedBy,
          respondedAt: data.respondedBy.respondedAt?.toDate()
        } : undefined
      } as CollaborationRequest;

    } catch (error) {
      console.error('❌ 개별 협업 요청 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 협업 요청 목록을 조회합니다
   * @param filters 필터 옵션
   * @returns 협업 요청 목록
   */
  static async getCollaborationRequests(filters?: {
    bookingId?: string;
    requestedToTeam?: Team;
    requestedByTeam?: Team;
    status?: CollaborationRequest['status'];
    type?: CollaborationType;
    limit?: number;
  }): Promise<CollaborationRequest[]> {
    try {
      let query: FirebaseFirestore.Query = this.db.collection('collaboration_requests');

      // 필터 적용
      if (filters?.bookingId) {
        query = query.where('bookingId', '==', filters.bookingId);
      }
      
      if (filters?.requestedToTeam) {
        query = query.where('requestedTo.team', '==', filters.requestedToTeam);
      }
      
      if (filters?.requestedByTeam) {
        query = query.where('requestedBy.team', '==', filters.requestedByTeam);
      }
      
      if (filters?.status) {
        query = query.where('status', '==', filters.status);
      }
      
      if (filters?.type) {
        query = query.where('type', '==', filters.type);
      }

      // 정렬 및 제한
      query = query.orderBy('createdAt', 'desc');
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const snapshot = await query.get();
      const requests: CollaborationRequest[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate,
          respondedBy: data.respondedBy ? {
            ...data.respondedBy,
            respondedAt: data.respondedBy.respondedAt instanceof Timestamp 
              ? data.respondedBy.respondedAt.toDate() 
              : data.respondedBy.respondedAt
          } : undefined
        } as CollaborationRequest);
      });

      return requests;

    } catch (error) {
      console.error('❌ 협업 요청 조회 실패:', error);
      return [];
    }
  }

  /**
   * 협업 요청에 응답합니다
   * @param requestId 협업 요청 ID
   * @param response 응답 내용
   * @param respondedBy 응답자 정보
   * @param status 새로운 상태
   * @returns 성공 여부
   */
  static async respondToCollaborationRequest(
    requestId: string,
    response: string,
    respondedBy: { userId: string; userName: string },
    status: 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
  ): Promise<boolean> {
    try {
      const docRef = this.db.collection('collaboration_requests').doc(requestId);
      
      await docRef.update({
        response,
        respondedBy: {
          ...respondedBy,
          respondedAt: new Date()
        },
        status,
        updatedAt: new Date()
      });

      console.log(`✅ 협업 요청 응답 완료: ${requestId} (${status})`);
      return true;

    } catch (error) {
      console.error('❌ 협업 요청 응답 실패:', requestId, error);
      return false;
    }
  }

  /**
   * 협업 요청을 수정합니다
   * @param requestId 협업 요청 ID
   * @param updateData 수정할 데이터
   * @returns 성공 여부
   */
  static async updateCollaborationRequest(
    requestId: string,
    updateData: Partial<Pick<CollaborationRequest, 'title' | 'description' | 'priority' | 'dueDate'>>
  ): Promise<boolean> {
    try {
      const docRef = this.db.collection('collaboration_requests').doc(requestId);
      
      await docRef.update({
        ...updateData,
        updatedAt: new Date()
      });

      console.log(`✅ 협업 요청 수정 완료: ${requestId}`);
      return true;

    } catch (error) {
      console.error('❌ 협업 요청 수정 실패:', requestId, error);
      return false;
    }
  }

  /**
   * 협업 요청을 삭제합니다
   * @param requestId 협업 요청 ID
   * @returns 성공 여부
   */
  static async deleteCollaborationRequest(requestId: string): Promise<boolean> {
    try {
      await this.db.collection('collaboration_requests').doc(requestId).delete();

      console.log(`✅ 협업 요청 삭제 완료: ${requestId}`);
      return true;

    } catch (error) {
      console.error('❌ 협업 요청 삭제 실패:', requestId, error);
      return false;
    }
  }

  /**
   * 특정 예약에 대한 협업 요청들을 조회합니다
   * @param bookingId 예약 ID
   * @returns 협업 요청 목록
   */
  static async getCollaborationRequestsByBooking(bookingId: string): Promise<CollaborationRequest[]> {
    return this.getCollaborationRequests({ bookingId });
  }

  /**
   * 특정 팀에서 받은 협업 요청들을 조회합니다
   * @param team 팀
   * @param status 상태 (선택사항)
   * @returns 협업 요청 목록
   */
  static async getPendingCollaborationRequestsForTeam(
    team: Team, 
    status?: CollaborationRequest['status']
  ): Promise<CollaborationRequest[]> {
    return this.getCollaborationRequests({ 
      requestedToTeam: team, 
      status: status || 'PENDING' 
    });
  }

  /**
   * 특정 팀에서 보낸 협업 요청들을 조회합니다
   * @param team 팀
   * @returns 협업 요청 목록
   */
  static async getSentCollaborationRequestsFromTeam(team: Team): Promise<CollaborationRequest[]> {
    return this.getCollaborationRequests({ requestedByTeam: team });
  }

  /**
   * 협업 요청 통계를 가져옵니다
   * @param team 팀 (선택사항, 없으면 전체)
   * @returns 통계 정보
   */
  static async getCollaborationStats(team?: Team): Promise<{
    pending: number;
    inProgress: number;
    completed: number;
    rejected: number;
    total: number;
  }> {
    try {
      let query: FirebaseFirestore.Query = this.db.collection('collaboration_requests');
      
      if (team) {
        query = query.where('requestedTo.team', '==', team);
      }

      const snapshot = await query.get();
      
      const stats = {
        pending: 0,
        inProgress: 0,
        completed: 0,
        rejected: 0,
        total: snapshot.size
      };

      snapshot.forEach(doc => {
        const data = doc.data();
        switch (data.status) {
          case 'PENDING':
            stats.pending++;
            break;
          case 'IN_PROGRESS':
            stats.inProgress++;
            break;
          case 'COMPLETED':
            stats.completed++;
            break;
          case 'REJECTED':
            stats.rejected++;
            break;
        }
      });

      return stats;

    } catch (error) {
      console.error('❌ 협업 요청 통계 조회 실패:', error);
      return {
        pending: 0,
        inProgress: 0,
        completed: 0,
        rejected: 0,
        total: 0
      };
    }
  }

  /**
   * 특정 사용자와 관련된 협업 요청들을 조회합니다
   * @param userId 사용자 ID
   * @returns 협업 요청 목록
   */
  static async getCollaborationRequestsForUser(userId: string): Promise<CollaborationRequest[]> {
    try {
      // 요청받은 것들과 요청한 것들을 모두 조회
      const [requestedTo, requestedBy] = await Promise.all([
        this.db.collection('collaboration_requests')
          .where('requestedTo.userIds', 'array-contains', userId)
          .orderBy('createdAt', 'desc')
          .get(),
        this.db.collection('collaboration_requests')
          .where('requestedBy.userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .get()
      ]);

      const requests: CollaborationRequest[] = [];
      const processedIds = new Set<string>();

      // 중복 제거하면서 요청 처리
      [...requestedTo.docs, ...requestedBy.docs].forEach(doc => {
        if (!processedIds.has(doc.id)) {
          const data = doc.data();
          requests.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
            dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate,
            respondedBy: data.respondedBy ? {
              ...data.respondedBy,
              respondedAt: data.respondedBy.respondedAt instanceof Timestamp 
                ? data.respondedBy.respondedAt.toDate() 
                : data.respondedBy.respondedAt
            } : undefined
          } as CollaborationRequest);
          processedIds.add(doc.id);
        }
      });

      // 생성일 기준 내림차순 정렬
      requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return requests;

    } catch (error) {
      console.error('❌ 사용자별 협업 요청 조회 실패:', userId, error);
      return [];
    }
  }

  /**
   * 만료된 협업 요청들을 조회합니다
   * @returns 만료된 협업 요청 목록
   */
  static async getOverdueCollaborationRequests(): Promise<CollaborationRequest[]> {
    try {
      const now = new Date();
      const snapshot = await this.db.collection('collaboration_requests')
        .where('status', 'in', ['PENDING', 'IN_PROGRESS'])
        .where('dueDate', '<', now)
        .orderBy('dueDate', 'asc')
        .get();

      const requests: CollaborationRequest[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate,
          respondedBy: data.respondedBy ? {
            ...data.respondedBy,
            respondedAt: data.respondedBy.respondedAt instanceof Timestamp 
              ? data.respondedBy.respondedAt.toDate() 
              : data.respondedBy.respondedAt
          } : undefined
        } as CollaborationRequest);
      });

      return requests;

    } catch (error) {
      console.error('❌ 만료된 협업 요청 조회 실패:', error);
      return [];
    }
  }
}
