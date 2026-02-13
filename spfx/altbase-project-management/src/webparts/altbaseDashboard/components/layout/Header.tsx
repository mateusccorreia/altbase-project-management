import * as React from 'react';
import styles from '../AltbaseDashboard.module.scss';
import { Activity } from 'lucide-react';

export interface IHeaderProps {
    userDisplayName: string;
}

export class Header extends React.Component<IHeaderProps, {}> {
    public render(): React.ReactElement<IHeaderProps> {
        const now = new Date();
        const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
        const dateStr = new Intl.DateTimeFormat('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(now);

        return (
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>
                        <Activity size={18} />
                    </div>
                    <div>
                        <h1 className={styles.headerTitle}>Grandes Reparos</h1>
                        <p className={styles.headerSub}>Dashboard de Acompanhamento</p>
                    </div>
                </div>

                <div className={styles.headerRight}>
                    <p className={styles.greeting}>{greeting}, {this.props.userDisplayName}!</p>
                    <p className={styles.dateStr}>{dateStr}</p>
                </div>
            </header>
        );
    }
}
