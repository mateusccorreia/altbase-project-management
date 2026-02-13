import * as React from 'react';
import styles from '../AltbaseDashboard.module.scss';
import {
    LayoutDashboard,
    FolderKanban,
    FileSpreadsheet,
    Settings,
    HelpCircle,
} from 'lucide-react';

export class Sidebar extends React.Component<{}, {}> {
    public render(): React.ReactElement {
        const navItems = [
            { label: 'Dashboard', icon: LayoutDashboard, active: true },
            { label: 'Projetos', icon: FolderKanban, active: false },
            { label: 'Relatórios', icon: FileSpreadsheet, active: false },
        ];

        const bottomItems = [
            { label: 'Configurações', icon: Settings },
            { label: 'Ajuda', icon: HelpCircle },
        ];

        return (
            <aside className={styles.sidebar}>
                <div className={styles.sidebarLogo}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div className={styles.logoIcon}>A</div>
                        <span className={styles.logoText}>Altbase</span>
                    </div>
                </div>

                <nav className={styles.sidebarNav}>
                    <p className={styles.sectionLabel}>Menu</p>
                    {navItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.label}
                                className={`${styles.navItem} ${item.active ? styles.active : ''}`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className={styles.sidebarBottom}>
                    {bottomItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <button key={item.label} className={styles.navItem}>
                                <Icon size={18} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                <div style={{ padding: '16px' }}>
                    <div className={styles.syncCard}>
                        <p className={styles.syncTitle}>SharePoint Sync</p>
                        <p className={styles.syncDesc}>
                            Dados sincronizados via Power Automate a partir dos arquivos MPP.
                        </p>
                        <div className={styles.syncStatus}>
                            <div className={styles.dot} />
                            <span className={styles.dotText}>Conectado</span>
                        </div>
                    </div>
                </div>
            </aside>
        );
    }
}
