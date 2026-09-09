"""create decisions and options tables

Revision ID: 6393c0aa9c56
Revises: 
Create Date: 2026-08-29 03:52:33.225146

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6393c0aa9c56'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # NOTE: decisions and options reference each other (options.decision_id ->
    # decisions.id, decisions.winner_id -> options.id). PostgreSQL validates FK
    # targets at CREATE TABLE time, so decisions is created WITHOUT the
    # winner_id constraint and it is added afterwards via ALTER TABLE — the
    # same deferral Base.metadata.create_all applies to cyclic foreign keys.
    op.create_table('decisions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=120), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('winner_id', sa.Integer(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('options',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('decision_id', sa.Integer(), nullable=False),
    sa.Column('label', sa.String(length=120), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['decision_id'], ['decisions.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_options_decision_id'), 'options', ['decision_id'], unique=False)
    with op.batch_alter_table('decisions', schema=None) as batch_op:
        batch_op.create_foreign_key(
            'fk_decisions_winner_id', 'options', ['winner_id'], ['id'],
            ondelete='SET NULL',
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('decisions', schema=None) as batch_op:
        batch_op.drop_constraint('fk_decisions_winner_id', type_='foreignkey')
    op.drop_index(op.f('ix_options_decision_id'), table_name='options')
    op.drop_table('options')
    op.drop_table('decisions')
