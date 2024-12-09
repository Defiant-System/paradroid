<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

	<xsl:template name="circuit-board-left">
		<svg viewBox="0 0 277 292">
			<xsl:for-each select="./*">
				<xsl:variable name="pos" select="position()"/>
				<g>
					<xsl:attribute name="transform">translate(33, <xsl:value-of select="14 + ($pos * 22)" />)</xsl:attribute>
					<circle class="switch" cx="-5" cy="0" r="5"/>
					<line class="line" x1="0" y1="0" x2="234" y2="0"/>
					<rect class="socket" x="233" y="-5" width="13" height="9" rx="3"/>
				</g>
			</xsl:for-each>
		</svg>
	</xsl:template>

	<xsl:template name="circuit-board-right">
		<svg viewBox="0 0 277 292">
			<xsl:for-each select="./*">
				<xsl:variable name="pos" select="position()"/>
				<g>
					<xsl:attribute name="transform">translate(-3, <xsl:value-of select="14 + ($pos * 22)" />)</xsl:attribute>
					<rect class="socket" x="0" y="-5" width="13" height="9" rx="3"/>
					<line class="line" x1="13" y1="0" x2="247" y2="0"/>
					<circle class="switch" cx="253" cy="0" r="5"/>
				</g>
			</xsl:for-each>
		</svg>
	</xsl:template>

	<xsl:template name="layer-background">
		<div class="layer-background" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='background']/*">
				<b>
					<xsl:attribute name="class"><xsl:value-of select="@id" /></xsl:attribute>
				</b>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-collision">
		<div class="layer-collision" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='collision']/*">
				<b>
					<xsl:attribute name="class"><xsl:value-of select="@id" /></xsl:attribute>
					<xsl:attribute name="style">
						--x: <xsl:value-of select="@x" />px;
						--y: <xsl:value-of select="@y" />px;
						<xsl:if test="@w">--w: <xsl:value-of select="@w" />px;</xsl:if>
						<xsl:if test="@h">--h: <xsl:value-of select="@h" />px;</xsl:if>
					</xsl:attribute>
				</b>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-action">
		<div class="layer-action" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='action']/*">
				<b>
					<xsl:attribute name="class">a1</xsl:attribute>
					<xsl:attribute name="style">
						<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
						<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
						<xsl:if test="@w">--w: <xsl:value-of select="@w" />;</xsl:if>
						<xsl:if test="@h">--h: <xsl:value-of select="@h" />;</xsl:if>
					</xsl:attribute>
					<xsl:attribute name="data-action"><xsl:value-of select="@action" /></xsl:attribute>
				</b>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-los">
		<div class="layer-los" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<!-- walls -->
			<xsl:for-each select="./Layer[@id='los']/walls">
				<xsl:variable name="pos" select="position()"/>
				<xsl:for-each select="./*">
					<div class="segment">
						<xsl:attribute name="data-group"><xsl:value-of select="$pos" /></xsl:attribute>
						<xsl:if test="position() = 1"><xsl:attribute name="data-type">start</xsl:attribute></xsl:if>
						<xsl:if test="position() > 1 and @x = ../*[position() = 1]/@x and @y = ../*[position() = 1]/@y"><xsl:attribute name="data-type">end</xsl:attribute></xsl:if>
						<xsl:attribute name="style">
							--sx: <xsl:value-of select="@x" />;
							--sy: <xsl:value-of select="@y" />;
							<xsl:if test="@w">--sw: <xsl:value-of select="@w" />;</xsl:if>
							<xsl:if test="@h">--sh: <xsl:value-of select="@h" />;</xsl:if>
							<xsl:if test="@d = '.5' or @d = '1.5'">--sa: <xsl:value-of select="@d" />;</xsl:if>
						</xsl:attribute>
					</div>
				</xsl:for-each>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-lights">
		<div class="layer-lights hide-helpers" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='lights']/*">
				<div class="spotlight">
					<!-- <xsl:if test="position() = 1"><xsl:attribute name="class">spotlight active</xsl:attribute></xsl:if> -->
					<xsl:attribute name="style">
						--x: <xsl:value-of select="@x" />;
						--y: <xsl:value-of select="@y" />;
						--r: <xsl:value-of select="@r" />;
					</xsl:attribute>
					<span class="handle"></span>
				</div>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-droids">
		<div class="layer-droids" data-click="put-tile">
			
		</div>
	</xsl:template>

</xsl:stylesheet>