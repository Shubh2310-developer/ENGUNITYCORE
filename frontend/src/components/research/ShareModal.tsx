'use client';

import { X } from 'lucide-react';
import { useResearchStore } from '@/stores/researchStore';
import styles from '../../app/(dashboard)/research/research.module.css';

/**
 * ShareModal — workspace collaboration invite dialog.
 *
 * Reads `showShareModal` and `setShowShareModal` from the Zustand researchStore.
 * Prop-drilled state (open, onClose) has been removed.
 *
 * CSS classes preserved for E2E selectors:
 *   shareOverlay, shareModal, shareHeader, closeBtn,
 *   shareInputGroup, shareInput, inviteBtn,
 *   collabList, collabItem, collabUser, collabAvatar, collabInfo, roleSelect
 */
export default function ShareModal() {
  const { showShareModal, setShowShareModal } = useResearchStore();

  if (!showShareModal) return null;

  return (
    <div className={styles.shareOverlay}>
      <div className={styles.shareModal}>
        <div className={styles.shareHeader}>
          <h3>Share Workspace</h3>
          <button className={styles.closeBtn} onClick={() => setShowShareModal(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className={styles.shareInputGroup}>
          <input
            type="email"
            placeholder="Collaborator email..."
            className={styles.shareInput}
          />
          <button className={styles.inviteBtn}>Invite</button>
        </div>

        <div className={styles.collabList}>
          {/* Owner row */}
          <div className={styles.collabItem}>
            <div className={styles.collabUser}>
              <div className={styles.collabAvatar}>JD</div>
              <div className={styles.collabInfo}>
                <h4>John Doe (You)</h4>
                <p>Owner</p>
              </div>
            </div>
            <select className={styles.roleSelect} disabled>
              <option>Owner</option>
            </select>
          </div>

          {/* Alice Kim row */}
          <div className={styles.collabItem}>
            <div className={styles.collabUser}>
              <div
                className={styles.collabAvatar}
                style={{ background: '#fef3c7', color: '#d97706' }}
              >
                AK
              </div>
              <div className={styles.collabInfo}>
                <h4>Alice Kim</h4>
                <p>alice.k@engunity.ai</p>
              </div>
            </div>
            <select className={styles.roleSelect}>
              <option>Editor</option>
              <option>Viewer</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
